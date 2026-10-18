package com.mariozamu.vozsegura;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Sends an alert to the backend from AlertCaptureService (same endpoints as the web client in
 * src/features/alert/alertApi.ts). Runs off the main thread and keeps working with the screen
 * off. Order matters: the alert first, chunks one by one, and the stop last so the server
 * knows how many chunks to expect. Uploaded chunk files are deleted from the phone.
 */
class AlertUploader {

    interface Reporter {
        /** item: alert | location | chunk | stop; index is -1 when it does not apply. */
        void onDelivery(String item, boolean ok, int index);
    }

    private static final String TAG = "AlertUpload";
    private static final int TIMEOUT_MS = 15_000;
    /** Backoff between attempts, about two minutes in total. */
    private static final long[] RETRY_DELAYS_MS = {2_000, 5_000, 10_000, 20_000, 30_000, 60_000};

    private final String baseUrl;
    private final String token;
    private final String alertId;
    /** Chooses the contacts the alert goes to; null falls back to the backend default. */
    private final String deviceId;
    private final long startedAt;
    /** "es" or "en": the language of the Telegram messages and the AI summary; null = Spanish. */
    private final String language;
    private final Reporter reporter;
    // One queue for the alert, audio and stop (ordered), another one so positions are never
    // stuck behind a slow audio upload.
    private final ExecutorService queue = Executors.newSingleThreadExecutor();
    private final ExecutorService locationQueue = Executors.newSingleThreadExecutor();
    private volatile boolean alertSent;

    AlertUploader(String baseUrl, String token, String alertId, String deviceId, long startedAt, String language,
                  Reporter reporter) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.token = token;
        this.alertId = alertId;
        this.deviceId = deviceId;
        this.startedAt = startedAt;
        this.language = language;
        this.reporter = reporter;
    }

    void sendAlert() {
        queue.execute(this::ensureAlertSent);
    }

    /** Not retried: the next position replaces a lost one. Skipped until the alert exists. */
    void sendLocation(double latitude, double longitude, float accuracy, long time) {
        locationQueue.execute(() -> {
            if (!alertSent) return;
            try {
                JSONObject location = new JSONObject()
                        .put("latitude", latitude)
                        .put("longitude", longitude)
                        .put("accuracy", accuracy)
                        .put("time", time);
                JSONObject body = new JSONObject().put("alertId", alertId).put("location", location);
                reporter.onDelivery("location", postJson("/api/location", body) / 100 == 2, -1);
            } catch (IOException | JSONException e) {
                reporter.onDelivery("location", false, -1);
            }
        });
    }

    void sendChunk(int index, File file, long durationMs) {
        queue.execute(() -> {
            ensureAlertSent();
            String path = "/api/audio?alertId=" + encode(alertId) + "&index=" + index + "&durationMs=" + durationMs;
            boolean ok = withRetry(() -> postFile(path, file, "audio/mp4"));
            if (ok) {
                //noinspection ResultOfMethodCallIgnored
                file.delete(); // nothing stays on the phone once the server has it
            }
            reporter.onDelivery("chunk", ok, index);
        });
    }

    /** Queues the stop and calls onDone (on the queue thread) once everything was sent. */
    void finish(String reason, int totalChunks, Runnable onDone) {
        queue.execute(() -> {
            ensureAlertSent();
            try {
                JSONObject body = new JSONObject()
                        .put("alertId", alertId)
                        .put("reason", reason)
                        .put("totalChunks", totalChunks);
                reporter.onDelivery("stop", withRetry(() -> postJson("/api/stop", body)), -1);
            } catch (JSONException e) {
                reporter.onDelivery("stop", false, -1);
            }
            locationQueue.shutdown();
            queue.shutdown();
            onDone.run();
        });
    }

    // ---- internals ----

    private interface Request {
        int send() throws IOException;
    }

    private void ensureAlertSent() {
        if (alertSent) return;
        try {
            JSONObject body = new JSONObject()
                    .put("alertId", alertId)
                    .put("startedAt", startedAt)
                    .put("captureKind", "native");
            if (deviceId != null) body.put("deviceId", deviceId);
            if (language != null) body.put("language", language);
            alertSent = withRetry(() -> postJson("/api/alerts", body));
        } catch (JSONException e) {
            alertSent = false;
        }
        reporter.onDelivery("alert", alertSent, -1);
    }

    /** Retries network errors, timeouts and 5xx; other 4xx answers are final. */
    private boolean withRetry(Request request) {
        for (int attempt = 0; ; attempt++) {
            try {
                int status = request.send();
                if (status / 100 == 2) return true;
                boolean retriable = status >= 500 || status == 408 || status == 429;
                Log.w(TAG, "HTTP " + status + (retriable ? ", retrying" : ", giving up"));
                if (!retriable) return false;
            } catch (IOException e) {
                Log.w(TAG, "Network error: " + e.getMessage());
            }
            if (attempt >= RETRY_DELAYS_MS.length) return false;
            try {
                Thread.sleep(RETRY_DELAYS_MS[attempt]);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
    }

    private HttpURLConnection open(String path, String contentType) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(baseUrl + path).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(TIMEOUT_MS);
        connection.setReadTimeout(TIMEOUT_MS);
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + token);
        connection.setRequestProperty("Content-Type", contentType);
        return connection;
    }

    private int postJson(String path, JSONObject body) throws IOException {
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        HttpURLConnection connection = open(path, "application/json");
        connection.setFixedLengthStreamingMode(bytes.length);
        try (OutputStream out = connection.getOutputStream()) {
            out.write(bytes);
        }
        return finish(connection, path);
    }

    private int postFile(String path, File file, String contentType) throws IOException {
        HttpURLConnection connection = open(path, contentType);
        connection.setFixedLengthStreamingMode(file.length());
        try (InputStream in = new FileInputStream(file); OutputStream out = connection.getOutputStream()) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
        }
        return finish(connection, path);
    }

    private int finish(HttpURLConnection connection, String path) throws IOException {
        try {
            int status = connection.getResponseCode();
            Log.d(TAG, "POST " + path.split("\\?")[0] + " -> " + status);
            return status;
        } finally {
            connection.disconnect();
        }
    }

    private static String encode(String value) {
        try {
            return URLEncoder.encode(value, "UTF-8");
        } catch (IOException e) {
            return value;
        }
    }
}
