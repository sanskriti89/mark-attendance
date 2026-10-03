package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.AuthTab
import com.example.data.Role
import com.example.data.Screen
import com.example.viewmodel.AttendanceViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("AttendIQ", appName)
  }

  @Test
  fun `verify role selection and switching`() {
    val viewModel = AttendanceViewModel()
    viewModel.selectRole(Role.STUDENT)
    assertEquals(Role.STUDENT, viewModel.uiState.value.currentRole)
    assertEquals(Screen.AUTH, viewModel.uiState.value.currentScreen)
    assertEquals(AuthTab.LOGIN, viewModel.uiState.value.authTab)

    viewModel.switchRole()
    assertEquals(Role.TEACHER, viewModel.uiState.value.currentRole)

    viewModel.switchRole()
    assertEquals(Role.STUDENT, viewModel.uiState.value.currentRole)
  }

  @Test
  fun `verify pin entry and validation with GGU Geofence and Sir Cancel Action`() {
    val viewModel = AttendanceViewModel()
    viewModel.appendStudentPinDigit("2")
    viewModel.appendStudentPinDigit("9")
    assertEquals("29", viewModel.uiState.value.studentEnteredPin)

    // Case 1: When within GGU Campus -> Verified
    viewModel.submitStudentAttendance()
    assertTrue(viewModel.uiState.value.studentAttendanceMarked)

    // Reset
    viewModel.resetStudentAttendance()
    viewModel.appendStudentPinDigit("2")
    viewModel.appendStudentPinDigit("9")

    // Case 2: When outside GGU Campus -> Blocked
    viewModel.toggleCampusGeofence() // toggles to outside
    viewModel.submitStudentAttendance()
    assertFalse(viewModel.uiState.value.studentAttendanceMarked)
    assertTrue(viewModel.uiState.value.studentAttendanceMessage!!.contains("Access Denied"))

    // Case 3: Teacher audits physical headcount and cancels proxy student in 1 tap
    val initialStudent = viewModel.attendanceRecords.value.first { it.sNo == "01" }
    assertTrue(initialStudent.isPresent)
    viewModel.cancelStudentAttendance("01")
    val updatedStudent = viewModel.attendanceRecords.value.first { it.sNo == "01" }
    assertFalse(updatedStudent.isPresent)
  }
}
