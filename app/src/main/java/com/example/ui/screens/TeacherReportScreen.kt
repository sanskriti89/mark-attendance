package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Screen
import com.example.ui.components.ExportCsvDialog
import com.example.ui.theme.DeptCseBg
import com.example.ui.theme.DeptCseText
import com.example.ui.theme.DeptCsitBg
import com.example.ui.theme.DeptCsitText
import com.example.ui.theme.DeptEceBg
import com.example.ui.theme.DeptEceText
import com.example.ui.theme.DeptItBg
import com.example.ui.theme.DeptItText
import com.example.ui.theme.EmeraldCheck
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate300
import com.example.ui.theme.Slate400
import com.example.ui.theme.Slate500
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate800
import com.example.ui.theme.Slate900
import com.example.ui.theme.SuccessGreenLight
import com.example.ui.theme.TeacherOrange
import com.example.viewmodel.AttendanceUiState
import com.example.viewmodel.AttendanceViewModel

@Composable
fun TeacherReportScreen(
    uiState: AttendanceUiState,
    viewModel: AttendanceViewModel,
    modifier: Modifier = Modifier
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val filteredRecords = viewModel.getFilteredAttendanceRecords()
    val presentCount = filteredRecords.count { it.isPresent }
    val hasDiscrepancy = presentCount > uiState.physicalHeadcount

    LaunchedEffect(uiState.userNotification) {
        uiState.userNotification?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissNotification()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.White)
            .testTag("teacher_report_screen")
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { viewModel.goBack() },
                        modifier = Modifier.size(44.dp).testTag("report_back_button")
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
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(TeacherOrange)
                            .border(2.dp, Color(0xFFFED7AA), CircleShape)
                        .clickable { viewModel.openProfileSheet() }
                            .testTag("report_avatar_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Teacher Profile",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "CS401: Database Management Systems",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    letterSpacing = (-0.2).sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Metadata Row: Instructor, Room, Time
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("INSTRUCTOR", fontSize = 9.5.sp, fontWeight = FontWeight.SemiBold, color = Slate400)
                        Text("Dr. Eleanor Vance", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                    }
                    Column {
                        Text("ROOM", fontSize = 9.5.sp, fontWeight = FontWeight.SemiBold, color = Slate400)
                        Text("Room FB", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("TIME", fontSize = 9.5.sp, fontWeight = FontWeight.SemiBold, color = Slate400)
                        Text("10:15 AM", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
                HorizontalDivider(color = Slate100, thickness = 1.dp)
            }

            // Scrollable Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 20.dp, vertical = 2.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Headcount Audit Card (Sir compares App vs Physical Count)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (hasDiscrepancy) Color(0xFFFFFBEB) else Color(0xFFF8FAFC))
                        .border(1.dp, if (hasDiscrepancy) Color(0xFFFDE68A) else Slate200, RoundedCornerShape(10.dp))
                        .padding(10.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("HEADCOUNT AUDIT", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp, color = Slate500)
                                if (hasDiscrepancy) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(Color(0xFFFEF2F2))
                                            .padding(horizontal = 6.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = "+${presentCount - uiState.physicalHeadcount} Discrepancy",
                                            fontSize = 9.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFFDC2626)
                                        )
                                    }
                                }
                            }

                            // Stepper to adjust physical count in room
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("Room Count: ", fontSize = 10.sp, color = Slate500)
                                Box(
                                    modifier = Modifier
                                        .size(22.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Slate200)
                                        .clickable {
                                            if (uiState.physicalHeadcount > 0) {
                                                viewModel.setPhysicalHeadcount(uiState.physicalHeadcount - 1)
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = null, tint = Slate700, modifier = Modifier.size(12.dp))
                                }

                                Text(
                                    text = "${uiState.physicalHeadcount}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900,
                                    modifier = Modifier.padding(horizontal = 2.dp)
                                )

                                Box(
                                    modifier = Modifier
                                        .size(22.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Slate200)
                                        .clickable { viewModel.setPhysicalHeadcount(uiState.physicalHeadcount + 1) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Slate700, modifier = Modifier.size(12.dp))
                                }
                            }
                        }

                        if (hasDiscrepancy) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Default.WarningAmber, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(14.dp))
                                Text(
                                    text = "Sir, app has $presentCount present but physical room count is ${uiState.physicalHeadcount}. Call out list below and tap '✕ Cancel' on missing students.",
                                    fontSize = 10.sp,
                                    color = Color(0xFF92400E),
                                    lineHeight = 13.sp
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Section Header & Present Badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Verified Attendance List",
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate800
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFFA7F3D0), RoundedCornerShape(12.dp))
                            .background(SuccessGreenLight)
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "$presentCount / ${filteredRecords.size} Present",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF047857)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Search Bar
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    placeholder = { Text("Search student name, roll no...", fontSize = 11.sp, color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Slate400, modifier = Modifier.size(16.dp)) },
                    trailingIcon = {
                        if (uiState.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear", tint = Slate400, modifier = Modifier.size(16.dp))
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("report_search_field"),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TeacherOrange,
                        unfocusedBorderColor = Slate200,
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Department filter chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("All", "CSIT", "CSE", "ECE", "IT").forEach { dept ->
                        val isSelected = uiState.selectedDeptFilter.equals(dept, ignoreCase = true)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (isSelected) TeacherOrange else Slate100)
                                .border(1.dp, if (isSelected) TeacherOrange else Slate200, RoundedCornerShape(14.dp))
                                .clickable { viewModel.setDeptFilter(dept) }
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = dept,
                                fontSize = 10.5.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else Slate700
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Table Container with Call-Out & One-Tap Cancel Action
                val startIndex = uiState.reportCurrentPage * uiState.reportPageSize
                val endIndex = minOf(startIndex + uiState.reportPageSize, filteredRecords.size)
                val pagedRecords = if (filteredRecords.isNotEmpty()) filteredRecords.subList(startIndex, endIndex) else emptyList()

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, Slate200, RoundedCornerShape(8.dp))
                        .background(Color.White)
                ) {
                    Column {
                        // Table Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF8FAFC))
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("S.NO.", fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Slate400, modifier = Modifier.width(38.dp))
                            Text("STUDENT NAME", fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Slate400, modifier = Modifier.weight(1f))
                            Text("DEPT", fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Slate400, modifier = Modifier.width(46.dp))
                            Text("SIR ACTION", fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Slate400, textAlign = TextAlign.End, modifier = Modifier.width(68.dp))
                        }

                        HorizontalDivider(color = Slate200, thickness = 1.dp)

                        if (pagedRecords.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No students found matching filter", fontSize = 12.sp, color = Slate400)
                            }
                        } else {
                            pagedRecords.forEach { record ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 10.dp, vertical = 7.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = record.sNo,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        color = Slate400,
                                        modifier = Modifier.width(38.dp)
                                    )
                                    Row(
                                        modifier = Modifier.weight(1f),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(6.dp)
                                                .clip(CircleShape)
                                                .background(if (record.isPresent) EmeraldCheck else Color(0xFFEF4444))
                                        )
                                        Text(
                                            text = record.studentName,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = if (record.isPresent) Slate800 else Slate400
                                        )
                                    }

                                    val (bg, fg) = when (record.dept) {
                                        "CSIT" -> DeptCsitBg to DeptCsitText
                                        "CSE" -> DeptCseBg to DeptCseText
                                        "ECE" -> DeptEceBg to DeptEceText
                                        "IT" -> DeptItBg to DeptItText
                                        else -> DeptCsitBg to DeptCsitText
                                    }

                                    Box(
                                        modifier = Modifier
                                            .width(46.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(bg)
                                                .padding(horizontal = 5.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = record.dept,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = fg
                                            )
                                        }
                                    }

                                    // Sir's One-Tap Cancel Action button
                                    Box(
                                        modifier = Modifier
                                            .width(68.dp),
                                        contentAlignment = Alignment.CenterEnd
                                    ) {
                                        if (record.isPresent) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(4.dp))
                                                    .background(Color(0xFFFEF2F2))
                                                    .clickable { viewModel.cancelStudentAttendance(record.sNo) }
                                                    .padding(horizontal = 6.dp, vertical = 3.dp)
                                                    .testTag("cancel_att_${record.sNo}")
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                                                ) {
                                                    Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(10.dp))
                                                    Text("Cancel", fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDC2626))
                                                }
                                            }
                                        } else {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(Slate100)
                                                    .clickable { viewModel.confirmStudentAttendance(record.sNo) }
                                                    .padding(horizontal = 6.dp, vertical = 3.dp)
                                            ) {
                                                Text("Absent", fontSize = 9.5.sp, color = Slate400, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }
                                }
                                HorizontalDivider(color = Color(0xFFF8FAFC), thickness = 1.dp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Pagination Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Showing ${pagedRecords.size} of ${filteredRecords.size} verified entries",
                        fontSize = 11.sp,
                        color = Slate500,
                        fontWeight = FontWeight.Medium
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .border(1.dp, Slate200, RoundedCornerShape(4.dp))
                                .clickable(enabled = uiState.reportCurrentPage > 0) { viewModel.prevReportPage() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowLeft,
                                contentDescription = "Previous Page",
                                tint = if (uiState.reportCurrentPage > 0) Slate700 else Slate300,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .border(1.dp, Slate200, RoundedCornerShape(4.dp))
                                .clickable { viewModel.nextReportPage() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowRight,
                                contentDescription = "Next Page",
                                tint = Slate700,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }

            // Footer Actions
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Primary Amber Export Button
                Button(
                    onClick = { viewModel.openExportModal() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("export_csv_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TeacherOrange)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Export CSV / Sheet",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }
                }

                // Secondary Save & Publish Action
                Button(
                    onClick = { viewModel.saveAndPublish() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(42.dp)
                        .testTag("save_publish_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = EmeraldCheck,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Save & Publish Attendance",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate700
                        )
                    }
                }

                // Back to Dashboard
                Text(
                    text = "← Back to Dashboard",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Slate400,
                    modifier = Modifier
                        .clickable { viewModel.navigateTo(Screen.TEACHER_BROADCAST_SETUP) }
                        .padding(vertical = 4.dp)
                        .testTag("back_to_dashboard_link")
                )
            }
        }

        // Export CSV Dialog
        if (uiState.isExportModalOpen) {
            ExportCsvDialog(
                records = filteredRecords,
                onDismiss = { viewModel.closeExportModal() },
                onDownloadAction = {
                    viewModel.closeExportModal()
                    viewModel.exportCsv()
                }
            )
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 60.dp)
        )
    }
}
