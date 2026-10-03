package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.Screen
import com.example.ui.components.QuickScreenSwitcher
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.DocumentVerificationScreen
import com.example.ui.screens.RegistrationSuccessScreen
import com.example.ui.screens.RoleSelectionScreen
import com.example.ui.screens.StudentAttendanceScreen
import com.example.ui.screens.TeacherBroadcastActiveScreen
import com.example.ui.screens.TeacherBroadcastSetupScreen
import com.example.ui.screens.TeacherReportScreen
import com.example.ui.theme.AttendIQTheme
import com.example.viewmodel.AttendanceViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AttendIQTheme {
                val viewModel: AttendanceViewModel = viewModel()
                val uiState by viewModel.uiState.collectAsState()

                BackHandler(enabled = uiState.currentScreen != Screen.ROLE_SELECTION) {
                    viewModel.goBack()
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = Color.White
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        // Current Screen
                        when (uiState.currentScreen) {
                            Screen.ROLE_SELECTION -> {
                                RoleSelectionScreen(
                                    onSelectRole = { role ->
                                        viewModel.selectRole(role)
                                    }
                                )
                            }
                            Screen.AUTH -> {
                                AuthScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                            Screen.DOC_VERIFICATION -> {
                                DocumentVerificationScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                            Screen.REGISTRATION_SUCCESS -> {
                                RegistrationSuccessScreen(
                                    viewModel = viewModel
                                )
                            }
                            Screen.TEACHER_BROADCAST_SETUP -> {
                                TeacherBroadcastSetupScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                            Screen.TEACHER_BROADCAST_ACTIVE -> {
                                TeacherBroadcastActiveScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                            Screen.STUDENT_ATTENDANCE -> {
                                StudentAttendanceScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                            Screen.TEACHER_REPORT -> {
                                TeacherReportScreen(
                                    uiState = uiState,
                                    viewModel = viewModel
                                )
                            }
                        }

                        // Targeted Broadcast Notification (Teacher triggers -> Enrolled Student pops up!)
                        com.example.ui.components.TargetedAttendanceAlert(
                            subjectCode = uiState.incomingSubjectCode,
                            subjectName = uiState.incomingSubjectName,
                            isVisible = uiState.isIncomingSessionAlertVisible,
                            onAccept = { viewModel.acceptIncomingSessionAlert() },
                            onDismiss = { viewModel.dismissIncomingAlert() },
                            modifier = Modifier.align(Alignment.TopCenter)
                        )

                        // Floating Quick Screen Switcher for reviewer convenience
                        if (uiState.currentScreen != Screen.ROLE_SELECTION) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                            ) {
                                QuickScreenSwitcher(
                                    currentScreen = uiState.currentScreen,
                                    currentRole = uiState.currentRole,
                                    viewModel = viewModel
                                )
                            }
                        }

                        // Profile & Device Telemetry Bottom Sheet
                        if (uiState.isProfileSheetOpen) {
                            com.example.ui.components.ProfileBottomSheet(
                                uiState = uiState,
                                viewModel = viewModel
                            )
                        }

                        // MongoDB Architecture & Schema Dialog
                        if (uiState.isMongoDbInfoOpen) {
                            com.example.ui.components.MongoDbSetupDialog(
                                onDismiss = { viewModel.closeMongoDbInfo() }
                            )
                        }
                    }
                }
            }
        }
    }
}
