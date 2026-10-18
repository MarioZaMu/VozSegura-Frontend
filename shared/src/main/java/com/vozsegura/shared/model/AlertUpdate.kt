package com.vozsegura.shared.model

import kotlinx.serialization.Serializable

/** Sent by the watch to the phone on every alert state change; the phone builds its history from these. */
@Serializable
data class AlertUpdate(
    val alertId: String,
    val state: AlertState,
    /** When the alert was triggered (double tap), not when this update was sent. */
    val createdAtEpochMs: Long,
    val updatedAtEpochMs: Long,
)
