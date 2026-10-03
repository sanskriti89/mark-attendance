package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Sensors
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Screen
import com.example.ui.theme.EmeraldCheck
import com.example.ui.theme.LiveRed
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate300
import com.example.ui.theme.Slate400
import com.example.ui.theme.Slate500
import com.example.ui.theme.Slate600
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate800
import com.example.ui.theme.Slate900
import com.example.ui.theme.SuccessGreenLight
import com.example.ui.theme.TeacherOrange
import com.example.ui.theme.TeacherOrangeDark
import com.example.ui.theme.TeacherOrangeLight
import com.example.viewmodel.AttendanceUiState
import com.example.viewmodel.AttendanceViewModel

@Composable
fun TeacherBroadcastActiveScreen(
    uiState: AttendanceUiState,
    viewModel: AttendanceViewModel,
    modifier: Modifier = Modifier
) {
    // Pulse animation for live broadcast dot
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Animated radio wave ripples expanding outward
    val waveProgress1 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wave1"
    )
    val waveProgress2 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, delayMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wave2"
    )

    val minutes = String.format("%02d", uiState.broadcastSecondsLeft / 60)
    val seconds = String.format("%02d", uiState.broadcastSecondsLeft % 60)
    var showRecentJoinsList by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color.White)
            .testTag("teacher_broadcast_active_screen"),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { viewModel.goBack() },
                    modifier = Modifier.size(44.dp).testTag("broadcast_active_back_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Slate700,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE08A3C))
                        .clickable { viewModel.openProfileSheet() }
                        .testTag("teacher_avatar_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = "Profile",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Broadcasting Active badge & Room identifier
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .scale(pulseScale)
                            .clip(CircleShape)
                            .background(LiveRed)
                    )
                    Text(
                        text = "BROADCASTING ACTIVE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = LiveRed
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                        .background(Slate100)
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "Room FB",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate600
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "CS401: Database Management Systems",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900,
                letterSpacing = (-0.2).sp
            )
            Text(
                text = "Dr. Eleanor Vance",
                fontSize = 13.sp,
                color = Slate500,
                fontWeight = FontWeight.Medium
            )
        }

        // Center Animated Timer Ring with ultrasonic wave ripples
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(250.dp)
                    .padding(6.dp),
                contentAlignment = Alignment.Center
            ) {
                // Expanding wave ripples
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val maxRadius = size.minDimension / 2
                    val strokeW = 1.5.dp.toPx()

                    // Ripple 1
                    val r1 = maxRadius * (0.8f + waveProgress1 * 0.2f)
                    val alpha1 = (1f - waveProgress1).coerceIn(0f, 1f) * 0.4f
                    drawCircle(
                        color = TeacherOrange.copy(alpha = alpha1),
                        radius = r1,
                        style = Stroke(width = strokeW)
                    )

                    // Ripple 2
                    val r2 = maxRadius * (0.8f + waveProgress2 * 0.2f)
                    val alpha2 = (1f - waveProgress2).coerceIn(0f, 1f) * 0.4f
                    drawCircle(
                        color = TeacherOrange.copy(alpha = alpha2),
                        radius = r2,
                        style = Stroke(width = strokeW)
                    )

                    // Base track ring
                    val trackStrokeW = 11.dp.toPx()
                    drawCircle(
                        color = Color(0xFFFFF7ED),
                        radius = maxRadius - trackStrokeW / 2,
                        style = Stroke(width = trackStrokeW)
                    )

                    // Active Sweep Arc
                    val progressFraction = (uiState.broadcastSecondsLeft.toFloat() / 165f).coerceIn(0f, 1f)
                    drawArc(
                        color = TeacherOrange,
                        startAngle = -90f,
                        sweepAngle = 360f * progressFraction,
                        useCenter = false,
                        style = Stroke(width = trackStrokeW, cap = StrokeCap.Round)
                    )
                }

                // Inner content
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "ATTENDANCE:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate400,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "${uiState.currentAttendanceCount} / ${uiState.totalAttendanceTarget}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate700
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "$minutes:$seconds",
                        fontSize = 46.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = Slate900
                    )

                    Text(
                        text = "REMAINING",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        color = TeacherOrange
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .scale(pulseScale)
                                .clip(CircleShape)
                                .background(TeacherOrange)
                        )
                        Text(
                            text = "Syncing devices",
                            fontSize = 10.sp,
                            color = Slate400,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Live Recent Student Check-ins Ticker
            if (uiState.recentJoins.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFFFFFBEB))
                        .border(1.dp, Color(0xFFFED7AA), RoundedCornerShape(20.dp))
                        .clickable { showRecentJoinsList = !showRecentJoinsList }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(EmeraldCheck)
                            )
                            Text(
                                text = "Recent: ${uiState.recentJoins.first()}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF92400E)
                            )
                        }
                        Text(
                            text = if (showRecentJoinsList) "Hide" else "View All",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TeacherOrange
                        )
                    }
                }

                AnimatedVisibility(visible = showRecentJoinsList) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF8FAFC))
                            .border(1.dp, Slate200, RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        uiState.recentJoins.forEach { joinInfo ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(5.dp)
                                        .clip(CircleShape)
                                        .background(EmeraldCheck)
                                )
                                Text(joinInfo, fontSize = 10.5.sp, color = Slate700)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Keep this screen open while students pair via ultrasonic & BLE broadcast.",
                fontSize = 12.sp,
                color = Slate400,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
        }

        // Bottom Action Controls
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Stop Broadcast Early
            OutlinedButton(
                onClick = { viewModel.stopBroadcastTimer() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("stop_broadcast_early_button"),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate300),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate700)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = null,
                        tint = Slate600,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Stop Broadcast Early",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate700
                    )
                }
            }

            // End Session & View Report
            Button(
                onClick = { viewModel.navigateTo(Screen.TEACHER_REPORT) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("end_session_view_report_button"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA34B16))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "End Session & View Report",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }
        }
    }
}
