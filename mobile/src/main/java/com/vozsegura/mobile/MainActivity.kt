package com.vozsegura.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.vozsegura.mobile.ui.navigation.VozSeguraApp
import com.vozsegura.mobile.ui.theme.VozSeguraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VozSeguraTheme {
                VozSeguraApp()
            }
        }
    }
}
