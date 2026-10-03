package com.example.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.NumericKeypad
import com.example.ui.theme.EmeraldCheck
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate300
import com.example.ui.theme.Slate400
import com.example.ui.theme.Slate600
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate800
import com.example.ui.theme.Slate900
import com.example.ui.theme.StudentTeal
import com.example.ui.theme.StudentTealLight
import com.example.ui.theme.SuccessGreenLight
import com.example.viewmodel.AttendanceUiState
import com.example.viewmodel.AttendanceViewModel

@Composable
fun StudentAttendanceScreen(
    uiState: AttendanceUiState,
    viewModel: AttendanceViewModel,
    modifier: Modifier = Modifier
) {
    val d1 = if (uiState.studentEnteredPin.isNotEmpty()) uiState.studentEnteredPin[0].toString() else "-"
    val d2 = if (uiState.studentEnteredPin.length > 1) uiState.studentEnteredPin[1].toString() else "-"

    val infiniteTransition = rememberInfiniteTransition(label = "beaconPulse")
    val beaconPulseScale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beaconPulse"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color.White)
            .testTag("student_attendance_screen"),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Header
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { viewModel.goBack() },
                    modifier = Modifier.size(44.dp).testTag("student_attendance_back_button")
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
                        .background(StudentTeal)
                        .clickable { viewModel.openProfileSheet() }
                        .testTag("student_avatar_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = "Student Profile",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Course metadata
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFEAF5F8))
                    .padding(horizontal = 10.dp, vertical = 3.dp)
            ) {
                Text(
                    text = "CS401",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    color = StudentTeal
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Database Management Systems",
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900,
                letterSpacing = (-0.2).sp
            )

            Row(
                modifier = Modifier.padding(top = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Instructor: ",
                    fontSize = 12.sp,
                    color = Slate400,
                    fontWeight = FontWeight.Normal
                )
                Text(
                    text = "Dr. Eleanor Vance",
                    fontSize = 12.sp,
                    color = Slate600,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Dual Verification Status: GGU Geofence + Classroom Acoustic Anti-Proxy
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                // Tier 1: GGU Campus Geofence
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (uiState.campusGeofence.isWithinBoundary) Color(0xFFF0FDF4) else Color(0xFFFEF2F2))
                        .border(1.dp, if (uiState.campusGeofence.isWithinBoundary) Color(0xFFBBF7D0) else Color(0xFFFECACA), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
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
                                    .size(6.dp)
                                    .scale(beaconPulseScale)
                                    .clip(CircleShape)
                                    .background(if (uiState.campusGeofence.isWithinBoundary) EmeraldCheck else Color(0xFFDC2626))
                            )
                            Text(
                                text = if (uiState.campusGeofence.isWithinBoundary)
                                    "📍 GGU Bilaspur Campus GPS: Inside Boundary"
                                else
                                    "📍 GGU Bilaspur Campus GPS: OUTSIDE (${uiState.campusGeofence.currentDistanceMeters.toInt()}m)",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (uiState.campusGeofence.isWithinBoundary) Color(0xFF166534) else Color(0xFF991B1B)
                            )
                        }
                        Text(
                            text = if (uiState.campusGeofence.isWithinBoundary) "Valid" else "Blocked",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (uiState.campusGeofence.isWithinBoundary) EmeraldCheck else Color(0xFFDC2626)
                        )
                    }
                }

                // Room Session & Timer Indicator
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFF8FAFC))
                        .border(1.dp, Slate200, RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Room FB • PIN announced verbally by Dr. Eleanor Vance",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = Slate600
                        )
                        Text(
                            text = "Active",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldCheck
                        )
                    }
                }
            }
        }

        // Concentric Pin Display Target
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 2.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Concentric Glowing Circle
            Box(
                modifier = Modifier
                    .size(175.dp)
                    .clip(CircleShape)
                    .border(1.dp, Color(0xFFCBEAF4).copy(alpha = 0.6f), CircleShape)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                listOf(
                                    Color(0xFFEDF8FB),
                                    Color(0xFFE2F4F9),
                                    Color(0xFFCFEEF7)
                                )
                            )
                        )
                        .border(2.dp, StudentTeal.copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "SESSION PIN",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp,
                            color = StudentTeal.copy(alpha = 0.85f)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Two-digit display
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            DigitUnderlineBox(digit = d1, isFilled = uiState.studentEnteredPin.isNotEmpty())
                            DigitUnderlineBox(digit = d2, isFilled = uiState.studentEnteredPin.length > 1)
                        }
                    }
                }
            }

            if (uiState.studentAttendanceMessage != null && !uiState.studentAttendanceMarked) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = uiState.studentAttendanceMessage,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFFDC2626),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Keypad
            NumericKeypad(
                onDigitClick = { viewModel.appendStudentPinDigit(it) },
                onClearClick = { viewModel.clearStudentPin() },
                onBackspaceClick = { viewModel.backspaceStudentPin() }
            )
        }

        // Bottom Action Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                onClick = { viewModel.submitStudentAttendance() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("mark_attendance_button"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = StudentTeal)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Mark Attendance",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Make sure Bluetooth and Location are enabled",
                fontSize = 11.sp,
                color = Slate400,
                textAlign = TextAlign.Center
            )
        }
    }

    // Success Dialog on Verified Attendance
    if (uiState.studentAttendanceMarked) {
        AlertDialog(
            onDismissRequest = { viewModel.resetStudentAttendance() },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(EmeraldCheck),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Text("Attendance Verified!", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Your attendance for CS401: Database Management Systems has been authenticated and logged.",
                        fontSize = 12.sp,
                        color = Slate700
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SuccessGreenLight)
                            .padding(10.dp)
                    ) {
                        Text(
                            "Verified via GGU Bilaspur Campus GPS Geofence + Session PIN\nStudent: Alex Morgan (2024-BTECH-CS-042)\nRecorded at 10:18 AM • Room FB",
                            fontSize = 11.sp,
                            color = Color(0xFF047857),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.resetStudentAttendance() },
                    colors = ButtonDefaults.buttonColors(containerColor = StudentTeal)
                ) {
                    Text("Done", color = Color.White)
                }
            }
        )
    }
}

@Composable
private fun DigitUnderlineBox(digit: String, isFilled: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(30.dp)
    ) {
        Text(
            text = digit,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = if (isFilled) Slate900 else Slate300
        )
        Spacer(modifier = Modifier.height(2.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .background(if (isFilled) StudentTeal else Slate300)
        )
    }
}
