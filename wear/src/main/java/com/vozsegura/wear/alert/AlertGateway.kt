package com.vozsegura.wear.alert

import kotlinx.coroutines.delay

/** Delivers alerts to trusted contacts. Real (backend) and fake (demo) implementations. */
interface AlertGateway {
    /** Sends the alert with the current location. Returns false on any failure. */
    suspend fun sendAlert(): Boolean

    /** Tells contacts the alert was cancelled ("estoy bien"). Best effort. */
    suspend fun sendCancellation()
}

/**
 * Demo gateway: simulates network latency, and optionally a few failures first so the
 * error and retry path can be shown in class without breaking anything.
 */
class FakeAlertGateway(
    private val latencyMs: Long = 1_200,
    private val failuresBeforeSuccess: Int = 0,
) : AlertGateway {

    private var attempts = 0

    override suspend fun sendAlert(): Boolean {
        delay(latencyMs)
        attempts++
        return attempts > failuresBeforeSuccess
    }

    override suspend fun sendCancellation() {
        delay(latencyMs)
        attempts = 0
    }
}
