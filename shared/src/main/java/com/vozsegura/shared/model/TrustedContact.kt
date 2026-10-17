package com.vozsegura.shared.model

import kotlinx.serialization.Serializable

@Serializable
data class TrustedContact(
    val id: String,
    val name: String,
    /** Telegram chat id obtained when the contact starts the bot. */
    val telegramChatId: String,
)
