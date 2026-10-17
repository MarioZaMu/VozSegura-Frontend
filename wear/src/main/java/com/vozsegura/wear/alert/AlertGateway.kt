package com.vozsegura.wear.alert

import android.util.Log
import com.vozsegura.shared.model.AlertPayload
import com.vozsegura.shared.model.CancelPayload
import kotlinx.coroutines.delay
import kotlinx.serialization.json.Json
import java.io.File

/** Delivers alerts to trusted contacts. Real (backend) and fake (demo) implementations. */
interface AlertGateway {
    /** Sends the alert with the location. Returns false on any failure. Must not wait for audio. */
    suspend fun sendAlert(payload: AlertPayload): Boolean

    /** Uploads the audio clip for the AI summary. Best effort, after the alert went out. */
    suspend fun sendAudio(alertId: String, contactChatIds: List<String>, clip: File): Boolean

    /** Tells contacts the alert was cancelled ("estoy bien"). Best effort. */
    suspend fun sendCancellation(payload: CancelPayload)
}

/**
 * Demo gateway: simulates network latency, and optionally a few failures first so the
 * error and retry path can be shown in class without breaking anything. Logs what would be
 * sent (tag FakeAlertGateway) so the payload can be checked in Logcat.
 */
class FakeAlertGateway(
    private val latencyMs: Long = 1_200,
    private val failuresBeforeSuccess: Int = 0,
) : AlertGateway {

    private var attempts = 0

    override suspend fun sendAlert(payload: AlertPayload): Boolean {
        delay(latencyMs)
        attempts++
        val delivered = attempts > failuresBeforeSuccess
        Log.i(TAG, "sendAlert attempt=$attempts delivered=$delivered ${Json.encodeToString(payload)}")
        return delivered
    }

    override suspend fun sendAudio(alertId: String, contactChatIds: List<String>, clip: File): Boolean {
        delay(latencyMs)
        Log.i(TAG, "sendAudio alertId=$alertId bytes=${clip.length()}")
        return true
    }

    override suspend fun sendCancellation(payload: CancelPayload) {
        delay(latencyMs)
        attempts = 0
        Log.i(TAG, "sendCancellation alertId=${payload.alertId}")
    }

    private companion object {
        const val TAG = "FakeAlertGateway"
    }
}
