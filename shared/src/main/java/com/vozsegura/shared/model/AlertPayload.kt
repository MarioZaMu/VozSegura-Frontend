package com.vozsegura.shared.model

import kotlinx.serialization.Serializable

@Serializable
data class AlertLocation(
    val latitude: Double,
    val longitude: Double,
    /** Horizontal accuracy radius in meters, if known. */
    val accuracyMeters: Float? = null,
    /** When the fix was taken (epoch ms); may be older than the alert if it is a cached fix. */
    val capturedAtEpochMs: Long,
)

/**
 * What the watch sends when an alert fires. Location is optional on purpose:
 * a missing GPS fix must never block or delay the alert.
 */
@Serializable
data class AlertPayload(
    val alertId: String,
    val createdAtEpochMs: Long,
    val message: String,
    val location: AlertLocation? = null,
    /** Telegram chat ids of the trusted contacts; the backend also adds its DEFAULT_CHAT_IDS. */
    val contactChatIds: List<String> = emptyList(),
)

@Serializable
data class CancelPayload(
    val alertId: String,
    val contactChatIds: List<String> = emptyList(),
)
