package com.mariozamu.vozsegura;

import android.Manifest;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * JS bridge for AlertCaptureService. Permissions use Capacitor's built-in
 * checkPermissions()/requestPermissions() with the aliases "microphone" and "location".
 * Service events reach JS as "captureEvent" (retained until a listener is attached).
 */
@CapacitorPlugin(
        name = "AlertCapture",
        permissions = {
                @Permission(alias = "microphone", strings = {Manifest.permission.RECORD_AUDIO}),
                @Permission(alias = "location", strings = {
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }),
        }
)
public class AlertCapturePlugin extends Plugin {

    @Override
    public void load() {
        AlertCaptureService.listener = event -> notifyListeners("captureEvent", event, true);
    }

    @Override
    protected void handleOnDestroy() {
        AlertCaptureService.listener = null;
    }

    @PluginMethod
    public void start(PluginCall call) {
        String alertId = call.getString("alertId");
        if (alertId == null || alertId.isEmpty()) {
            call.reject("alertId is required");
            return;
        }
        Intent intent = new Intent(getContext(), AlertCaptureService.class)
                .setAction(AlertCaptureService.ACTION_START)
                .putExtra(AlertCaptureService.EXTRA_ALERT_ID, alertId)
                .putExtra(AlertCaptureService.EXTRA_CHUNK_SECONDS, call.getInt("chunkSeconds", 20))
                .putExtra(AlertCaptureService.EXTRA_MAX_DURATION_SECONDS, call.getInt("maxDurationSeconds", 300))
                .putExtra(AlertCaptureService.EXTRA_API_BASE_URL, call.getString("apiBaseUrl", ""))
                .putExtra(AlertCaptureService.EXTRA_API_TOKEN, call.getString("apiToken"))
                .putExtra(AlertCaptureService.EXTRA_STARTED_AT, call.getData().optLong("startedAt", System.currentTimeMillis()));
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (RuntimeException e) {
            call.reject("Android no permitió iniciar la captura", e);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (AlertCaptureService.running) {
            Intent intent = new Intent(getContext(), AlertCaptureService.class)
                    .setAction(AlertCaptureService.ACTION_STOP);
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        status.put("running", AlertCaptureService.running);
        status.put("alertId", AlertCaptureService.currentAlertId);
        status.put("chunkCount", AlertCaptureService.chunkCount);
        call.resolve(status);
    }
}
