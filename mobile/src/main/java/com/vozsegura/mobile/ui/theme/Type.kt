package com.vozsegura.mobile.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.vozsegura.shared.R

/** Poppins is bundled in :shared so it works offline (no downloadable fonts during the demo). */
val Poppins = FontFamily(
    Font(R.font.poppins_regular, FontWeight.Normal),
    Font(R.font.poppins_medium, FontWeight.Medium),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
)

private fun poppins(
    weight: FontWeight,
    size: TextUnit,
    lineHeight: TextUnit,
    letterSpacing: TextUnit = 0.sp,
) = TextStyle(
    fontFamily = Poppins,
    fontWeight = weight,
    fontSize = size,
    lineHeight = lineHeight,
    letterSpacing = letterSpacing,
)

val VsTypography = Typography(
    displayLarge = poppins(FontWeight.Bold, 48.sp, 56.sp, (-0.02).em),
    displayMedium = poppins(FontWeight.Bold, 40.sp, 48.sp, (-0.02).em),
    displaySmall = poppins(FontWeight.Bold, 32.sp, 40.sp, (-0.01).em),
    headlineLarge = poppins(FontWeight.SemiBold, 28.sp, 36.sp),
    headlineMedium = poppins(FontWeight.SemiBold, 24.sp, 32.sp),
    headlineSmall = poppins(FontWeight.SemiBold, 20.sp, 28.sp),
    titleLarge = poppins(FontWeight.SemiBold, 18.sp, 26.sp),
    titleMedium = poppins(FontWeight.SemiBold, 16.sp, 24.sp),
    titleSmall = poppins(FontWeight.Medium, 14.sp, 20.sp),
    bodyLarge = poppins(FontWeight.Normal, 16.sp, 24.sp),
    bodyMedium = poppins(FontWeight.Normal, 14.sp, 20.sp),
    bodySmall = poppins(FontWeight.Normal, 12.sp, 18.sp),
    labelLarge = poppins(FontWeight.SemiBold, 15.sp, 20.sp),
    labelMedium = poppins(FontWeight.Medium, 12.sp, 16.sp),
    labelSmall = poppins(FontWeight.Medium, 11.sp, 16.sp, 0.02.em),
)
