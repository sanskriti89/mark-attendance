import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { GguDepartmentPicker } from '../components/GguDepartmentPicker';
import { ALL_GGU_DEPARTMENTS } from '../data/gguUniversityData';

export const AuthScreen: React.FC = () => {
  const {
    currentRole,
    authTab,
    setAuthTab,
    studentEnrollment,
    setStudentEnrollment,
    studentPassword,
    setStudentPassword,
    teacherFacultyId,
    setTeacherFacultyId,
    teacherPassword,
    setTeacherPassword,
    studentRegName,
    setStudentRegName,
    studentRegEnrollment,
    setStudentRegEnrollment,
    studentRegEmail,
    setStudentRegEmail,
    studentCourseLevel,
    setStudentCourseLevel,
    studentDepartment,
    setStudentDepartment,
    studentRegPassword,
    setStudentRegPassword,
    teacherRegName,
    setTeacherRegName,
    teacherRegFacultyId,
    setTeacherRegFacultyId,
    teacherRegEmail,
    setTeacherRegEmail,
    teacherDepartment,
    setTeacherDepartment,
    teacherRegPassword,
    setTeacherRegPassword,
    uploadedPdfName,
    isPdfUploading,
    studentEnrolledCourses,
    uploadAndExtractPdf,
    navigateTo,
    goBack,
    setUserNotification,
  } = useAttendance();

  const [showPassword, setShowPassword] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(true);

  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  // Selected department details for display
  const currentDeptObj = ALL_GGU_DEPARTMENTS.find(
    (d) => d.code === (isTeacher ? teacherDepartment : studentDepartment)
  ) || {
    code: studentDepartment || 'CSIT',
    name: 'Computer Science & Information Technology',
    school: 'Engineering & Technology',
  };

  const handleLogin = () => {
    if (isTeacher) {
      setUserNotification(`Welcome, Dr. Vance (${teacherFacultyId})!`);
      navigateTo('TEACHER_DASHBOARD');
    } else {
      setUserNotification(`Welcome, Anand Mohan Kumar (${studentEnrollment})!`);
      navigateTo('STUDENT_DASHBOARD');
    }
  };

  const handleRegisterNext = () => {
    navigateTo('DOC_VERIFICATION');
  };

  const fillQuickDemo = () => {
    if (isTeacher) {
      setTeacherFacultyId('FAC-CS-8924');
      setTeacherPassword('password123');
    } else {
      setStudentEnrollment('GGV/25/250/0024');
      setStudentPassword('password123');
    }
  };

  const handleBrowsePdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadAndExtractPdf(file.name);
      }
    } catch {
      Alert.alert(
        'Document Picker',
        'Could not open system file picker. Loading official sample slip.',
        [{ text: 'Load Sample', onPress: () => uploadAndExtractPdf('GGU_Course_Selection_Slip.pdf') }]
      );
    }
  };

  const handleSamplePdf = () => {
    uploadAndExtractPdf('GGU_Course_Selection_Slip.pdf');
  };

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (authTab === 'REGISTER') {
              setAuthTab('LOGIN');
            } else {
              goBack();
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.slate700} />
        </TouchableOpacity>

        {authTab === 'LOGIN' && (
          <View style={styles.topRightRole}>
            <Text style={[styles.roleLabel, { color: brandColor }]}>
              {isTeacher ? 'FACULTY PORTAL' : 'STUDENT PORTAL'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {authTab === 'LOGIN' ? (
          /* ======================== LOGIN VIEW ======================== */
          <View style={styles.loginWrapper}>
            <View style={styles.loginHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Guru Ghasidas Vishwavidyalaya (GGU) Attendance Management
              </Text>
            </View>

            {/* Segmented Control */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, styles.activeTabButton, { backgroundColor: brandColor }]}
                onPress={() => setAuthTab('LOGIN')}
              >
                <Text style={[styles.tabText, styles.activeTabText]}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => setAuthTab('REGISTER')}
              >
                <Text style={styles.tabText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Demo Pre-fill */}
            <TouchableOpacity style={styles.demoFillBtn} onPress={fillQuickDemo}>
              <MaterialIcons name="auto-fix-high" size={16} color={brandColor} />
              <Text style={[styles.demoFillText, { color: brandColor }]}>
                Fill Demo {isTeacher ? 'Faculty' : 'Student'} Credentials
              </Text>
            </TouchableOpacity>

            <View style={styles.formContainer}>
              {isTeacher ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Faculty ID</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="badge" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={teacherFacultyId}
                      onChangeText={setTeacherFacultyId}
                      placeholder="e.g. FAC-CS-8924"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Enrollment Number</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="school" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={studentEnrollment}
                      onChangeText={setStudentEnrollment}
                      placeholder="e.g. GGV/25/250/0024"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="lock" size={20} color={Colors.slate400} />
                  <TextInput
                    style={styles.input}
                    value={isTeacher ? teacherPassword : studentPassword}
                    onChangeText={isTeacher ? setTeacherPassword : setStudentPassword}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.slate400}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={Colors.slate400}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPassBtn}
                onPress={() =>
                  Alert.alert(
                    'Password Reset',
                    'A password reset link will be sent to your registered @ggu.ac.in email.'
                  )
                }
              >
                <Text style={[styles.forgotPassText, { color: brandColor }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: brandColor }]}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  Log In to {isTeacher ? 'Teacher Dashboard' : 'Student Academic Hub'}
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>

              {/* Bottom Switch to Register */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => setAuthTab('REGISTER')}
              >
                <Text style={styles.switchAuthText}>New student? </Text>
                <Text style={[styles.switchAuthLink, { color: brandColor }]}>
                  Register with Course Selection PDF →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================== REGISTER VIEW (MATCHES SCREENSHOT) ======================== */
          <View style={styles.registerWrapper}>
            {/* Step 1 of 2 Subtitle */}
            <Text style={[styles.stepIndicatorText, { color: brandColor }]}>
              STEP 1 OF 2
            </Text>

            {/* STEP 1: UPLOAD COURSE SELECTION PDF CARD */}
            <View
              style={[
                styles.pdfUploadCard,
                {
                  borderColor: uploadedPdfName ? '#86EFAC' : '#BAE6FD',
                  backgroundColor: uploadedPdfName ? '#F0FDF4' : '#F0F9FF',
                },
              ]}
            >
              {/* Card Header Row */}
              <View style={styles.pdfHeaderRow}>
                <View
                  style={[
                    styles.pdfIconBadge,
                    {
                      backgroundColor: uploadedPdfName ? '#DCFCE7' : '#E0F2FE',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={uploadedPdfName ? 'check-circle' : 'upload-file'}
                    size={22}
                    color={uploadedPdfName ? '#16A34A' : brandColor}
                  />
                </View>

                <View style={styles.pdfTitleColumn}>
                  <Text style={styles.pdfCardTitle}>
                    {isTeacher
                      ? 'STEP 1: Upload Faculty Appointment Order'
                      : 'STEP 1: Upload Course Selection PDF'}
                  </Text>
                  <Text
                    style={[
                      styles.pdfCardSubtitle,
                      { color: uploadedPdfName ? '#15803D' : Colors.slate500 },
                    ]}
                  >
                    {uploadedPdfName
                      ? `Verified Slip: ${uploadedPdfName}`
                      : 'Upload GGU course slip to auto-fill registration'}
                  </Text>
                </View>

                {isPdfUploading && (
                  <ActivityIndicator size="small" color={brandColor} />
                )}
              </View>

              {/* Two Action Buttons: Browse PDF & Sample Slip */}
              <View style={styles.pdfButtonsRow}>
                <TouchableOpacity
                  style={[styles.browsePdfBtn, { backgroundColor: brandColor }]}
                  onPress={handleBrowsePdf}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="folder-open" size={17} color={Colors.white} />
                  <Text style={styles.browsePdfBtnText}>Browse PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sampleSlipBtn, { borderColor: brandColor }]}
                  onPress={handleSamplePdf}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={brandColor} />
                  <Text style={[styles.sampleSlipBtnText, { color: brandColor }]}>
                    Sample Slip
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Auto-Extracted Courses Preview Chips */}
              {studentEnrolledCourses.length > 0 && (
                <View style={styles.extractedCoursesContainer}>
                  <Text style={styles.extractedCoursesLabel}>
                    Auto-Extracted Enrolled Courses ({studentEnrolledCourses.length} Subjects Mapped):
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.coursesChipsScroll}
                  >
                    {studentEnrolledCourses.map((code, index) => (
                      <View
                        key={`${code}-${index}`}
                        style={[styles.courseChip, { backgroundColor: brandColor }]}
                      >
                        <Text style={styles.courseChipText}>{code}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* STEP 2: VERIFY AUTO-FILLED PROFILE DETAILS */}
            <Text style={styles.step2HeaderTitle}>
              STEP 2: Verify Auto-Filled Profile Details
            </Text>

            <View style={styles.profileFieldsContainer}>
              {/* Field 1: Name */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Name</Text>
                <View
                  style={[
                    styles.textInputCard,
                    isNameFocused && { borderColor: brandColor, borderWidth: 1.8 },
                  ]}
                >
                  <TextInput
                    style={styles.textInputFilled}
                    value={isTeacher ? teacherRegName : studentRegName}
                    onChangeText={isTeacher ? setTeacherRegName : setStudentRegName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="e.g. ANAND MOHAN KUMAR"
                    placeholderTextColor={Colors.slate400}
                    autoCapitalize="characters"
                  />
                  {isNameFocused && (
                    <View
                      style={[styles.cursorIndicatorDot, { backgroundColor: brandColor }]}
                    />
                  )}
                </View>
              </View>

              {/* Field 2: Enrollment No. / Faculty ID */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {isTeacher ? 'Faculty ID' : 'Enrollment No.'}
                </Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={isTeacher ? teacherRegFacultyId : studentRegEnrollment}
                    onChangeText={
                      isTeacher ? setTeacherRegFacultyId : setStudentRegEnrollment
                    }
                    placeholder={isTeacher ? 'FAC-CS-8924' : 'GGV/25/250/0024'}
                    placeholderTextColor={Colors.slate400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Field 3: Department (GGU Official) Dropdown Card */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Department (GGU Official)</Text>
                <TouchableOpacity
                  style={styles.deptPickerCard}
                  onPress={() => setShowDeptPicker(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.deptBadge}>
                    <Text style={styles.deptBadgeText}>{currentDeptObj.code}</Text>
                  </View>

                  <View style={styles.deptTextColumn}>
                    <Text style={styles.deptNameText} numberOfLines={1}>
                      {currentDeptObj.name.replace('Department of ', '')}
                    </Text>
                    <Text style={styles.deptSchoolText} numberOfLines={1}>
                      {currentDeptObj.school}
                    </Text>
                  </View>

                  <MaterialIcons
                    name="arrow-drop-down"
                    size={22}
                    color={Colors.slate500}
                  />
                </TouchableOpacity>
              </View>

              {/* Field 4: Email */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={isTeacher ? teacherRegEmail : studentRegEmail}
                    onChangeText={isTeacher ? setTeacherRegEmail : setStudentRegEmail}
                    placeholder="name@ggu.ac.in"
                    placeholderTextColor={Colors.slate400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Field 5: Course (UG / PG Radio Buttons) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Course</Text>
                <View style={styles.radioGroupRow}>
                  {/* Radio UG */}
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setStudentCourseLevel('UG')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioOuterCircle,
                        studentCourseLevel === 'UG' && { borderColor: brandColor },
                      ]}
                    >
                      {studentCourseLevel === 'UG' && (
                        <View
                          style={[
                            styles.radioInnerCircle,
                            { backgroundColor: brandColor },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabelText,
                        studentCourseLevel === 'UG' && styles.radioLabelTextActive,
                      ]}
                    >
                      UG
                    </Text>
                  </TouchableOpacity>

                  {/* Radio PG */}
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setStudentCourseLevel('PG')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioOuterCircle,
                        studentCourseLevel === 'PG' && { borderColor: brandColor },
                      ]}
                    >
                      {studentCourseLevel === 'PG' && (
                        <View
                          style={[
                            styles.radioInnerCircle,
                            { backgroundColor: brandColor },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabelText,
                        studentCourseLevel === 'PG' && styles.radioLabelTextActive,
                      ]}
                    >
                      PG
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 6: Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={[styles.textInputFilled, { flex: 1 }]}
                    value={isTeacher ? teacherRegPassword : studentRegPassword}
                    onChangeText={
                      isTeacher ? setTeacherRegPassword : setStudentRegPassword
                    }
                    placeholder="Create password"
                    placeholderTextColor={Colors.slate400}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={Colors.slate400}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Action Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: brandColor, marginTop: 12 }]}
                onPress={handleRegisterNext}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => setAuthTab('LOGIN')}
              >
                <Text style={styles.switchAuthText}>Already registered? </Text>
                <Text style={[styles.switchAuthLink, { color: brandColor }]}>
                  Log In instead →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Department Picker Modal */}
      <GguDepartmentPicker
        visible={showDeptPicker}
        onClose={() => setShowDeptPicker(false)}
        brandColor={brandColor}
        selectedDeptCode={isTeacher ? teacherDepartment : studentDepartment}
        onSelectDepartment={(dept) => {
          if (isTeacher) {
            setTeacherDepartment(dept.name);
          } else {
            setStudentDepartment(dept.code);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  topRightRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.slate100,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  /* ================= LOGIN STYLES ================= */
  loginWrapper: {
    paddingTop: 8,
  },
  loginHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.slate900,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 4,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate600,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDFA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 20,
    gap: 6,
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: Colors.white,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.slate900,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ================= REGISTER VIEW (SCREENSHOT EXACT MATCH) ================= */
  registerWrapper: {
    paddingTop: 6,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  /* STEP 1: Upload PDF Card */
  pdfUploadCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    gap: 14,
  },
  pdfHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitleColumn: {
    flex: 1,
    gap: 2,
  },
  pdfCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.slate900,
  },
  pdfCardSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  pdfButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  browsePdfBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  browsePdfBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sampleSlipBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1.2,
    backgroundColor: '#F0FDFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  sampleSlipBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  extractedCoursesContainer: {
    marginTop: 2,
    gap: 8,
  },
  extractedCoursesLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.slate700,
  },
  coursesChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  courseChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  courseChipText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* STEP 2: Verify Profile Details */
  step2HeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.slate800,
    letterSpacing: 0.4,
    marginBottom: 16,
  },
  profileFieldsContainer: {
    gap: 16,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
  },
  textInputCard: {
    height: 48,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  textInputFilled: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  cursorIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    right: 12,
    bottom: -5,
  },

  /* Department Picker Card */
  deptPickerCard: {
    height: 52,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deptBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  deptBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  deptTextColumn: {
    flex: 1,
  },
  deptNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
  },
  deptSchoolText: {
    fontSize: 10.5,
    color: Colors.slate500,
    marginTop: 1,
  },

  /* Course Radio Buttons */
  radioGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    paddingVertical: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuterCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.slate400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.slate600,
  },
  radioLabelTextActive: {
    color: Colors.slate900,
    fontWeight: '800',
  },

  /* Buttons & Footers */
  primaryButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 12.5,
    color: Colors.slate500,
  },
  switchAuthLink: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
