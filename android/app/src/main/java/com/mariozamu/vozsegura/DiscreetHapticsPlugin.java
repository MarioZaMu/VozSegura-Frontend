package com.mariozamu.vozsegura;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

/**
 * Vibrates with the ALARM usage instead of TOUCH.
 *
 * @capacitor/haptics vibrates as touch feedback, and Android drops it
 * (IGNORED_FOR_SETTINGS) when "touch vibration" is off — common on Xiaomi phones. A
 * panic-button confirmation must be felt regardless of that setting.
 */
@CapacitorPlugin(name = "DiscreetHaptics")
public class DiscreetHapticsPlugin extends Plugin {

    @PluginMethod
    public void vibrate(PluginCall call) {
        JSArray pattern = call.getArray("pattern");
        if (pattern == null || pattern.length() == 0) {
            call.reject("pattern is required");
            return;
        }

        long[] timings;
        try {
            // Android waveforms start with a delay: [0, vibrate, pause, vibrate…]
            timings = new long[pattern.length() + 1];
            timings[0] = 0;
            for (int i = 0; i < pattern.length(); i++) timings[i + 1] = pattern.getLong(i);
        } catch (JSONException e) {
            call.reject("pattern must be a list of milliseconds");
            return;
        }

        Vibrator vibrator = getVibrator();
        if (vibrator == null || !vibrator.hasVibrator()) {
            JSObject result = new JSObject();
            result.put("vibrated", false);
            call.resolve(result);
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            vibrator.vibrate(timings, -1); // Android 7: no effects or usages
            JSObject result = new JSObject();
            result.put("vibrated", true);
            call.resolve(result);
            return;
        }

        VibrationEffect effect = VibrationEffect.createWaveform(timings, -1);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            vibrator.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM));
        } else {
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            vibrator.vibrate(effect, attributes);
        }

        JSObject result = new JSObject();
        result.put("vibrated", true);
        call.resolve(result);
    }

    private Vibrator getVibrator() {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager manager = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return manager != null ? manager.getDefaultVibrator() : null;
        }
        return (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    }
}
