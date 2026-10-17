package com.vozsegura.wear.presentation.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Typography
import com.vozsegura.shared.R

/** Poppins is bundled in :shared so it works offline. */
val Poppins = FontFamily(
    Font(R.font.poppins_regular, FontWeight.Normal),
    Font(R.font.poppins_medium, FontWeight.Medium),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
)

/**
 * Wear Material 3 scale (sizes tuned by Google for 1.2-2 inch screens) rendered in Poppins.
 * `Typography(defaultFontFamily = ...)` does not reach the predefined styles, so each one is
 * re-based explicitly.
 */
internal val BrandTypography: Typography = Typography().run {
    fun TextStyle.poppins() = copy(fontFamily = Poppins)
    Typography(
        displayLarge = displayLarge.poppins(),
        displayMedium = displayMedium.poppins(),
        displaySmall = displaySmall.poppins(),
        titleLarge = titleLarge.poppins(),
        titleMedium = titleMedium.poppins(),
        titleSmall = titleSmall.poppins(),
        labelLarge = labelLarge.poppins(),
        labelMedium = labelMedium.poppins(),
        labelSmall = labelSmall.poppins(),
        bodyLarge = bodyLarge.poppins(),
        bodyMedium = bodyMedium.poppins(),
        bodySmall = bodySmall.poppins(),
        bodyExtraSmall = bodyExtraSmall.poppins(),
        numeralExtraLarge = numeralExtraLarge.poppins(),
        numeralLarge = numeralLarge.poppins(),
        numeralMedium = numeralMedium.poppins(),
        numeralSmall = numeralSmall.poppins(),
        numeralExtraSmall = numeralExtraSmall.poppins(),
    )
}

/**
 * Watch face styles at the reference size ([WatchDimens.referenceScreen]). The watch face
 * scales them linearly with the real screen width so proportions match on every device.
 */
object WatchFaceType {
    val Time = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.SemiBold,
        fontSize = 48.sp,
        lineHeight = 52.sp,
        letterSpacing = (-0.02).em,
    )
    /** Ambient uses a lighter weight: fewer lit pixels, less power and burn-in. */
    val TimeAmbient = Time.copy(fontWeight = FontWeight.Normal)
    /** "a. m." / "p. m." next to the hour when the device uses 12-hour time. */
    val Period = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 14.sp,
    )
    val Date = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp,
    )
    val Complication = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 14.sp,
    )
}

/** Returns this style with every size multiplied by [factor]. */
fun TextStyle.scaled(factor: Float): TextStyle = copy(
    fontSize = fontSize * factor,
    lineHeight = lineHeight * factor,
)
