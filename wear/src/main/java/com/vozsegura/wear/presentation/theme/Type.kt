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

/** Wear Material 3 scale (sizes tuned by Google for 1.2-2 inch screens) rendered in Poppins. */
internal val BrandTypography = Typography(defaultFontFamily = Poppins)

/** Watch face styles, sized for a ~200dp round screen (responsive scaling arrives in phase 3). */
object WatchFaceType {
    val Time = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.SemiBold,
        fontSize = 48.sp,
        lineHeight = 52.sp,
        letterSpacing = (-0.02).em,
    )
    val Date = TextStyle(
        fontFamily = Poppins,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp,
    )
}
