package com.vozsegura.shared.model

import kotlinx.serialization.Serializable

/** Lifecycle of a single panic alert, shared by watch, phone and backend payloads. */
@Serializable
enum class AlertState {
    /** No alert in progress; the watch shows a normal watch face. */
    IDLE,

    /** Gesture confirmed; recording audio and acquiring location. */
    ACTIVATED,

    /** Location (and audio, if available) delivered to the backend. */
    SENT,

    /** Delivery failed; the watch keeps retrying silently. */
    ERROR,

    /** User cancelled the alert (false alarm). */
    CANCELLED,
}
