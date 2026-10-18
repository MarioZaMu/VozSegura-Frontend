package com.mariozamu.vozsegura;

import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Audio that could not be sent during an alert (no signal, phone turned off, app killed) stays
 * in files/alerts/{alertId}/ next to a meta.json that AlertCaptureService keeps up to date:
 * { alertId, startedAt, deviceId?, language?, durations: { "0": ms, ... }, totalChunks, stopReason?, stopSent }.
 * flush() sends what is left the next time the app opens, then the stop, and deletes it all.
 */
final class PendingAlerts {

    private static final String TAG = "PendingAlerts";
    private static final String META = "meta.json";
    /** Older leftovers are deleted unsent: a day later the audio no longer helps anyone. */
    private static final long MAX_AGE_MS = 24 * 60 * 60 * 1000L;
    private static final long ALERT_TIMEOUT_MINUTES = 10;
    private static final AtomicBoolean flushing = new AtomicBoolean(false);

    private PendingAlerts() {
    }

    // ---- meta.json (written by the service) ----

    static synchronized void writeMeta(File dir, JSONObject meta) {
        try (OutputStream out = new FileOutputStream(new File(dir, META))) {
            out.write(meta.toString().getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            Log.w(TAG, "Could not write meta", e);
        }
    }

    static synchronized JSONObject readMeta(File dir) {
        File file = new File(dir, META);
        if (!file.exists()) return new JSONObject();
        try (InputStream in = new FileInputStream(file)) {
            byte[] bytes = new byte[(int) file.length()];
            int read = 0;
            while (read < bytes.length) {
                int n = in.read(bytes, read, bytes.length - read);
                if (n < 0) break;
                read += n;
            }
            return new JSONObject(new String(bytes, 0, read, StandardCharsets.UTF_8));
        } catch (IOException | JSONException e) {
            Log.w(TAG, "Unreadable meta in " + dir.getName(), e);
            return new JSONObject();
        }
    }

    static File[] chunkFiles(File dir) {
        File[] files = dir.listFiles((parent, name) -> name.endsWith(".m4a"));
        if (files == null) return new File[0];
        Arrays.sort(files);
        return files;
    }

    /** Deletes the folder once nothing is left to send. */
    static void deleteIfDone(File dir) {
        if (chunkFiles(dir).length > 0 || !readMeta(dir).optBoolean("stopSent")) return;
        deleteDir(dir);
    }

    // ---- flush (called when the app opens) ----

    /** Sends every leftover alert in the background. Returns how many folders it found. */
    static int flush(Context context, String baseUrl, String token) {
        File[] dirs = new File(context.getFilesDir(), "alerts").listFiles(File::isDirectory);
        if (dirs == null || dirs.length == 0 || !flushing.compareAndSet(false, true)) return 0;
        new Thread(() -> {
            try {
                for (File dir : dirs) flushOne(dir, baseUrl, token);
            } finally {
                flushing.set(false);
            }
        }, "PendingAlerts").start();
        return dirs.length;
    }

    private static void flushOne(File dir, String baseUrl, String token) {
        String alertId = dir.getName();
        if (alertId.equals(AlertCaptureService.busyAlertId)) return; // still recording or sending

        JSONObject meta = readMeta(dir);
        long startedAt = meta.optLong("startedAt", dir.lastModified());
        if (System.currentTimeMillis() - startedAt > MAX_AGE_MS) {
            Log.i(TAG, "Dropping old alert " + alertId);
            deleteDir(dir);
            return;
        }

        // A chunk with no duration was still being recorded when the app died: the file is
        // unplayable, so it is dropped. Folders from before meta.json existed send everything.
        JSONObject durations = meta.optJSONObject("durations");
        int finished = 0;
        File[] chunks = chunkFiles(dir);
        for (File chunk : chunks) {
            int index = chunkIndex(chunk);
            if (index < 0 || (durations != null && !durations.has(String.valueOf(index)))) {
                //noinspection ResultOfMethodCallIgnored
                chunk.delete();
            } else {
                finished = Math.max(finished, index + 1);
            }
        }
        chunks = chunkFiles(dir);
        if (chunks.length == 0 && meta.optBoolean("stopSent")) {
            deleteDir(dir);
            return;
        }

        Log.i(TAG, "Sending leftover alert " + alertId + " (" + chunks.length + " chunks)");
        boolean[] stopSent = {false};
        AlertUploader uploader = new AlertUploader(baseUrl, token, alertId,
                meta.has("deviceId") ? meta.optString("deviceId") : null, startedAt,
                meta.has("language") ? meta.optString("language") : null,
                (item, ok, index) -> {
                    if ("stop".equals(item)) stopSent[0] = ok;
                });
        for (File chunk : chunks) {
            int index = chunkIndex(chunk);
            long durationMs = durations != null ? durations.optLong(String.valueOf(index), 20_000) : 20_000;
            uploader.sendChunk(index, chunk, durationMs);
        }
        int totalChunks = meta.optInt("totalChunks", -1);
        String reason = meta.has("stopReason") ? meta.optString("stopReason") : "error";
        CountDownLatch done = new CountDownLatch(1);
        uploader.finish(reason, totalChunks >= 0 ? totalChunks : finished, done::countDown);
        try {
            if (!done.await(ALERT_TIMEOUT_MINUTES, TimeUnit.MINUTES)) return;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        if (stopSent[0]) {
            try {
                writeMeta(dir, meta.put("stopSent", true));
            } catch (JSONException ignored) {
                // put() only throws for non-finite numbers
            }
        }
        deleteIfDone(dir);
    }

    /** "chunk-007.m4a" → 7, or -1. */
    private static int chunkIndex(File file) {
        String name = file.getName();
        try {
            return Integer.parseInt(name.substring(name.indexOf('-') + 1, name.lastIndexOf('.')));
        } catch (RuntimeException e) {
            return -1;
        }
    }

    private static void deleteDir(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            //noinspection ResultOfMethodCallIgnored
            for (File file : files) file.delete();
        }
        //noinspection ResultOfMethodCallIgnored
        dir.delete();
    }
}
