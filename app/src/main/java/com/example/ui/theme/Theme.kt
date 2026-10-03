package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = StudentTeal,
    onPrimary = Color.White,
    primaryContainer = StudentTealLight,
    onPrimaryContainer = StudentTealDark,
    secondary = TeacherOrange,
    onSecondary = Color.White,
    secondaryContainer = TeacherOrangeLight,
    onSecondaryContainer = TeacherOrangeDark,
    background = Color(0xFFF8FAFC),
    onBackground = Slate900,
    surface = Color.White,
    onSurface = Slate900,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Slate700,
    outline = Slate300
)

@Composable
fun AttendIQTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
