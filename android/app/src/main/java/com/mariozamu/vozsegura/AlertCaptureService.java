package com.mariozamu.vozsegura;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import java.io.File;
import java.util.Locale;

/**
 * Foreground service that keeps recording audio and tracking location while the alert is
 * active, even with the screen locked (the WebView's JavaScript pauses then).
 *
 * - Audio: AAC in .m4a chunks (one MediaRecorder per chunk, so each file plays on its own),
 *   stored in files/alerts/{alertId}/ with a meta.json; whatever is not sent is resent by
 *   PendingAlerts the next time the app opens.
 * - Location: fused provider, high accuracy, every ~10 s.
 * - Delivery: AlertUploader sends the alert, positions and each finished chunk to the backend
 *   (deleting the file once uploaded) and keeps the service alive until the stop is sent.
 * - Microphone and location are independent: one failing never stops the other, and the
 *   alert is sent even without any permission.
 * - The mandatory notification uses a neutral text and the lowest importance. The app does
 *   not ask for the notification permission, so on Android 13+ it is not shown at all.
 */
public class AlertCaptureService extends Service {

    public interface EventListener {
        void onEvent(JSObject event);
    }

    static final String ACTION_START = "com.mariozamu.vozsegura.capture.START";
    static final String ACTION_STOP = "com.mariozamu.vozsegura.capture.STOP";
    static final String EXTRA_ALERT_ID = "alertId";
    static final String EXTRA_CHUNK_SECONDS = "chunkSeconds";
    static final String EXTRA_MAX_DURATION_SECONDS = "maxDurationSeconds";
    static final String EXTRA_API_BASE_URL = "apiBaseUrl";
    static final String EXTRA_API_TOKEN = "apiToken";
    static final String EXTRA_STARTED_AT = "startedAt";
    static final String EXTRA_DEVICE_ID = "deviceId";
    static final String EXTRA_LANGUAGE = "language";
    /** Longest wait for pending uploads after the recording stopped. */
    private static final long DRAIN_TIMEOUT_MS = 4 * 60_000;

    private static final String TAG = "AlertCapture";
    private static final String CHANNEL_ID = "sync";
    private static final int NOTIFICATION_ID = 7;
    private static final long LOCATION_INTERVAL_MS = 10_000;
    private static final int AUDIO_SAMPLE_RATE = 16_000;
    private static final int AUDIO_BIT_RATE = 32_000;

    /** Set by AlertCapturePlugin; events are also logged so adb shows them. */
    static volatile EventListener listener;
    static volatile boolean running;
    static volatile String currentAlertId;
    static volatile int chunkCount;
    /** Alert whose folder is in use (recording or still sending); PendingAlerts skips it. */
    static volatile String busyAlertId;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private PowerManager.WakeLock wakeLock;
    private FusedLocationProviderClient locationClient;
    private LocationCallback locationCallback;
    private MediaRecorder recorder;
    private File currentChunkFile;
    private long currentChunkStartedAt;
    private File alertDir;
    private long chunkMillis;
    private boolean stopping;
    /** Recording finished but uploads are still being sent. */
    private boolean draining;
    @Nullable
    private AlertUploader uploader;
    /** Mirror of files/alerts/{alertId}/meta.json, see PendingAlerts. */
    private JSONObject meta = new JSONObject();

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopCapture("user");
            return START_NOT_STICKY;
        }
        if (running) return START_NOT_STICKY; // one recording at a time (JS guards it too)
        if (draining) {
            // A new alert while the previous one is still being sent: that upload keeps going
            // on its own threads, and from now on only the new alert decides when we stop.
            handler.removeCallbacksAndMessages(null);
            draining = false;
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        }

        String alertId = intent.getStringExtra(EXTRA_ALERT_ID);
        chunkMillis = intent.getIntExtra(EXTRA_CHUNK_SECONDS, 20) * 1000L;
        long maxDurationMillis = intent.getIntExtra(EXTRA_MAX_DURATION_SECONDS, 300) * 1000L;
        String apiBaseUrl = intent.getStringExtra(EXTRA_API_BASE_URL);
        String apiToken = intent.getStringExtra(EXTRA_API_TOKEN);
        File dir = new File(getFilesDir(), "alerts/" + alertId);
        JSONObject alertMeta = new JSONObject();
        uploader = apiBaseUrl == null || apiBaseUrl.isEmpty() || apiToken == null
                ? null
                : new AlertUploader(apiBaseUrl, apiToken, alertId, intent.getStringExtra(EXTRA_DEVICE_ID),
                        intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis()),
                        intent.getStringExtra(EXTRA_LANGUAGE), (item, ok, index) -> {
                            if ("stop".equals(item) && ok) putMeta(dir, alertMeta, "stopSent", true);
                            emitDelivery(item, ok, index);
                        });

        boolean canRecord = hasPermission(Manifest.permission.RECORD_AUDIO);
        boolean canLocate = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                || hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION);

        if (!canRecord && !canLocate) {
            emitError("microphone", "Permiso de micrófono no concedido");
            emitError("location", "Permiso de ubicación no concedido");
            emitStopped("error");
            // Nothing to record, but the contacts are still warned (the app is in the
            // foreground right after the gesture, so a plain service may use the network).
            if (uploader != null) {
                alertDir = null; // nothing recorded, no folder
                uploader.sendAlert();
                finishUpload("error", 0);
            } else {
                stopSelf();
            }
            return START_NOT_STICKY;
        }

        // Only declare the service types we actually hold permissions for (Android 14 rule).
        int types = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (canRecord) types |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            if (canLocate) types |= ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
        }
        try {
            ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), types);
        } catch (RuntimeException e) {
            Log.e(TAG, "startForeground failed", e);
            emitError(canRecord ? "microphone" : "location", "Android no permitió iniciar la captura");
            emitStopped("error");
            stopSelf();
            return START_NOT_STICKY;
        }

        running = true;
        stopping = false;
        currentAlertId = alertId;
        chunkCount = 0;
        alertDir = dir;
        meta = alertMeta;
        //noinspection ResultOfMethodCallIgnored
        alertDir.mkdirs();
        busyAlertId = alertId;
        updateMeta("alertId", alertId);
        updateMeta("startedAt", intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis()));
        updateMeta("deviceId", intent.getStringExtra(EXTRA_DEVICE_ID));
        updateMeta("language", intent.getStringExtra(EXTRA_LANGUAGE));
        updateMeta("durations", new JSONObject());

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VozSegura:capture");
        wakeLock.acquire(maxDurationMillis + DRAIN_TIMEOUT_MS);

        if (uploader != null) uploader.sendAlert();

        if (canLocate) startLocation();
        else emitError("location", "Permiso de ubicación no concedido");

        if (canRecord) startNextChunk();
        else emitError("microphone", "Permiso de micrófono no concedido");

        handler.postDelayed(() -> stopCapture("max-duration"), maxDurationMillis);
        Log.i(TAG, "Capture started for alert " + alertId);
        return START_NOT_STICKY;
    }

    // ---- Location ----

    private void startLocation() {
        try {
            locationClient = LocationServices.getFusedLocationProviderClient(this);
            LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, LOCATION_INTERVAL_MS)
                    .setMinUpdateIntervalMillis(LOCATION_INTERVAL_MS / 2)
                    .build();
            locationCallback = new LocationCallback() {
                @Override
                public void onLocationResult(@NonNull LocationResult result) {
                    Location location = result.getLastLocation();
                    if (location != null) emitLocation(location);
                }
            };
            locationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
            emitStarted("location");
        } catch (SecurityException | IllegalStateException e) {
            Log.e(TAG, "Location failed", e);
            emitError("location", "No se pudo obtener la ubicación");
        }
    }

    // ---- Audio ----

    private void startNextChunk() {
        if (stopping) return;
        currentChunkFile = new File(alertDir, String.format(Locale.US, "chunk-%03d.m4a", chunkCount));
        MediaRecorder next = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? new MediaRecorder(this)
                : new MediaRecorder();
        try {
            next.setAudioSource(MediaRecorder.AudioSource.MIC);
            next.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            next.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            next.setAudioChannels(1);
            next.setAudioSamplingRate(AUDIO_SAMPLE_RATE);
            next.setAudioEncodingBitRate(AUDIO_BIT_RATE);
            next.setOutputFile(currentChunkFile.getAbsolutePath());
            next.prepare();
            next.start();
        } catch (Exception e) {
            Log.e(TAG, "Recording failed", e);
            next.release();
            emitError("microphone", "No se pudo usar el micrófono");
            return;
        }
        recorder = next;
        currentChunkStartedAt = SystemClock.elapsedRealtime();
        if (chunkCount == 0) emitStarted("microphone");
        handler.postDelayed(this::rotateChunk, chunkMillis);
    }

    private void rotateChunk() {
        finishCurrentChunk();
        startNextChunk();
    }

    private void finishCurrentChunk() {
        if (recorder == null) return;
        long durationMs = SystemClock.elapsedRealtime() - currentChunkStartedAt;
        try {
            recorder.stop();
        } catch (RuntimeException e) {
            // stop() throws if almost nothing was recorded; drop that chunk.
            //noinspection ResultOfMethodCallIgnored
            currentChunkFile.delete();
            recorder.release();
            recorder = null;
            return;
        }
        recorder.release();
        recorder = null;
        recordDuration(chunkCount, durationMs);
        emitChunk(chunkCount, currentChunkFile, durationMs);
        if (uploader != null) uploader.sendChunk(chunkCount, currentChunkFile, durationMs);
        chunkCount++;
    }

    // ---- Stop ----

    private void stopCapture(String reason) {
        if (!running || stopping) {
            if (!draining) stopSelf();
            return;
        }
        stopping = true;
        handler.removeCallbacksAndMessages(null);
        finishCurrentChunk();
        if (locationClient != null && locationCallback != null) {
            locationClient.removeLocationUpdates(locationCallback);
        }
        running = false;
        updateMeta("stopReason", reason);
        updateMeta("totalChunks", chunkCount);
        emitStopped(reason);
        Log.i(TAG, "Capture stopped (" + reason + ") with " + chunkCount + " chunks");
        if (uploader == null) {
            shutdown();
            return;
        }
        // Stay in the foreground (and awake) until the last chunk and the stop are sent.
        finishUpload(reason, chunkCount);
        handler.postDelayed(this::shutdown, DRAIN_TIMEOUT_MS);
    }

    /** Sends the stop; the service shuts down afterwards unless a newer alert took over. */
    private void finishUpload(String reason, int totalChunks) {
        AlertUploader finishing = uploader;
        File dir = alertDir;
        draining = true;
        finishing.finish(reason, totalChunks, () -> handler.post(() -> {
            if (uploader == finishing) shutdown();
            else if (dir != null) PendingAlerts.deleteIfDone(dir);
        }));
    }

    private void shutdown() {
        if (!draining && running) return;
        handler.removeCallbacksAndMessages(null);
        draining = false;
        uploader = null;
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        // Anything not sent stays for PendingAlerts.flush() the next time the app opens.
        if (alertDir != null) PendingAlerts.deleteIfDone(alertDir);
        busyAlertId = null;
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
        Log.i(TAG, "Service finished");
    }

    @Override
    public void onDestroy() {
        if (running) stopCapture("error");
        super.onDestroy();
    }

    // ---- Notification ----

    private Notification buildNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Sincronización", NotificationManager.IMPORTANCE_MIN);
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            manager.createNotificationChannel(channel);
        }
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle("Sincronizando…")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .setSilent(true)
                .setOngoing(true)
                .build();
    }

    // ---- Events (same shape as CaptureEvent in src/features/alert/alertCapture.ts) ----

    private boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }

    private void emit(JSObject event) {
        Log.d(TAG, "event " + event);
        EventListener current = listener;
        if (current != null) current.onEvent(event);
    }

    private void emitStarted(String source) {
        JSObject event = new JSObject();
        event.put("type", "started");
        event.put("source", source);
        emit(event);
    }

    private void emitError(String source, String message) {
        JSObject event = new JSObject();
        event.put("type", "error");
        event.put("source", source);
        event.put("message", message);
        emit(event);
    }

    private void emitStopped(String reason) {
        JSObject event = new JSObject();
        event.put("type", "stopped");
        event.put("reason", reason);
        emit(event);
    }

    private void emitLocation(Location location) {
        JSObject fix = new JSObject();
        fix.put("latitude", location.getLatitude());
        fix.put("longitude", location.getLongitude());
        fix.put("accuracy", location.getAccuracy());
        fix.put("time", location.getTime());
        JSObject event = new JSObject();
        event.put("type", "location");
        event.put("fix", fix);
        emit(event);
        if (uploader != null) {
            uploader.sendLocation(location.getLatitude(), location.getLongitude(), location.getAccuracy(), location.getTime());
        }
    }

    // ---- meta.json ----

    private void updateMeta(String key, @Nullable Object value) {
        putMeta(alertDir, meta, key, value);
    }

    /** Also called from the uploader threads, possibly for an older alert still being sent. */
    private synchronized void putMeta(@Nullable File dir, JSONObject target, String key, @Nullable Object value) {
        if (dir == null || !dir.isDirectory()) return;
        try {
            target.put(key, value);
        } catch (JSONException e) {
            return;
        }
        PendingAlerts.writeMeta(dir, target);
    }

    private synchronized void recordDuration(int index, long durationMs) {
        if (alertDir == null) return;
        JSONObject durations = meta.optJSONObject("durations");
        if (durations == null) return;
        try {
            durations.put(String.valueOf(index), durationMs);
        } catch (JSONException e) {
            return;
        }
        PendingAlerts.writeMeta(alertDir, meta);
    }

    /** Called from the uploader threads. */
    private void emitDelivery(String item, boolean ok, int index) {
        JSObject event = new JSObject();
        event.put("type", "delivery");
        event.put("item", item);
        event.put("ok", ok);
        if (index >= 0) event.put("index", index);
        emit(event);
    }

    private void emitChunk(int index, File file, long durationMs) {
        JSObject chunk = new JSObject();
        chunk.put("index", index);
        chunk.put("sizeBytes", file.length());
        chunk.put("durationMs", durationMs);
        chunk.put("mimeType", "audio/mp4");
        chunk.put("path", file.getAbsolutePath());
        JSObject event = new JSObject();
        event.put("type", "chunk");
        event.put("chunk", chunk);
        emit(event);
    }
}
