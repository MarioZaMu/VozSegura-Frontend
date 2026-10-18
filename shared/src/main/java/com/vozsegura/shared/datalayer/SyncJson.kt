package com.vozsegura.shared.datalayer

import kotlinx.serialization.json.Json

/**
 * JSON used across the Data Layer. Tolerates unknown keys, so a newer phone app never breaks
 * an older watch app (they update independently from the Play Store).
 */
val SyncJson = Json { ignoreUnknownKeys = true }
