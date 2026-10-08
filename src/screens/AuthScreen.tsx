import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { GguDepartmentPicker } from '../components/GguDepartmentPicker';

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
    navigateTo,
    setUserNotification,
  } = useAttendance();

  const [showPassword, setShowPassword] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  const handleLogin = () => {
    if (isTeacher) {
      setUserNotification(`Welcome, Dr. Vance (${teacherFacultyId})!`);
      navigateTo('TEACHER_DASHBOARD');
    } else {
      setUserNotification(`Welcome, Anand Mohan Kumar (${studentEnrollment})!`);
      navigateTo('STUDENT_DASHBOARD');
    }
  };

  const handleRegisterStep1 = () => {
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

  return (
    <View style={styles.container}>
      <CommonTopBar />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.roleBadge, { color: brandColor }]}>
            {isTeacher ? 'FACULTY PORTAL' : 'STUDENT PORTAL'}
          </Text>
          <Text style={styles.title}>
            {authTab === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            Guru Ghasidas Vishwavidyalaya (GGU) Attendance Management
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              authTab === 'LOGIN' && { backgroundColor: brandColor },
            ]}
            onPress={() => setAuthTab('LOGIN')}
          >
            <Text
              style={[
                styles.tabText,
                authTab === 'LOGIN' && styles.activeTabText,
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              authTab === 'REGISTER' && { backgroundColor: brandColor },
            ]}
            onPress={() => setAuthTab('REGISTER')}
          >
            <Text
              style={[
                styles.tabText,
                authTab === 'REGISTER' && styles.activeTabText,
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Pre-fill Pill */}
        <TouchableOpacity style={styles.demoFillBtn} onPress={fillQuickDemo}>
          <MaterialIcons name="auto-fix-high" size={16} color={brandColor} />
          <Text style={[styles.demoFillText, { color: brandColor }]}>
            Fill Demo {isTeacher ? 'Faculty' : 'Student'} Credentials
          </Text>
        </TouchableOpacity>

        {/* LOGIN FORM */}
        {authTab === 'LOGIN' ? (
          <View style={styles.formContainer}>
            {isTeacher ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Faculty ID</Text>
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
                <Text style={styles.label}>Enrollment Number</Text>
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
              <Text style={styles.label}>Password</Text>
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
              style={[styles.submitButton, { backgroundColor: brandColor }]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                Log In to {isTeacher ? 'Teacher Dashboard' : 'Student Academic Hub'}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          /* REGISTRATION FORM */
          <View style={styles.formContainer}>
            {isTeacher ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="person" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={teacherRegName}
                      onChangeText={setTeacherRegName}
                      placeholder="e.g. Dr. Eleanor Vance"
                      placeholderTextColor={Colors.slate400}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Faculty ID</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="badge" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={teacherRegFacultyId}
                      onChangeText={setTeacherRegFacultyId}
                      placeholder="e.g. FAC-CS-8924"
                      placeholderTextColor={Colors.slate400}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GGU Faculty Email</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="email" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={teacherRegEmail}
                      onChangeText={setTeacherRegEmail}
                      placeholder="name@ggu.ac.in"
                      placeholderTextColor={Colors.slate400}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department</Text>
                  <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setShowDeptPicker(true)}
                  >
                    <MaterialIcons name="apartment" size={20} color={Colors.slate400} />
                    <Text style={[styles.input, { paddingTop: 14 }]}>
                      {teacherDepartment || 'Select GGU Department'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color={Colors.slate500} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="person" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={studentRegName}
                      onChangeText={setStudentRegName}
                      placeholder="e.g. ANAND MOHAN KUMAR"
                      placeholderTextColor={Colors.slate400}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enrollment Number</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="school" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={studentRegEnrollment}
                      onChangeText={setStudentRegEnrollment}
                      placeholder="e.g. GGV/25/250/0024"
                      placeholderTextColor={Colors.slate400}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GGU Student Email</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="email" size={20} color={Colors.slate400} />
                    <TextInput
                      style={styles.input}
                      value={studentRegEmail}
                      onChangeText={setStudentRegEmail}
                      placeholder="anand.kumar@ggu.ac.in"
                      placeholderTextColor={Colors.slate400}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Level & Department</Text>
                  <View style={styles.rowInputs}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        studentCourseLevel === 'UG' && {
                          backgroundColor: brandColor,
                          borderColor: brandColor,
                        },
                      ]}
                      onPress={() => setStudentCourseLevel('UG')}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          studentCourseLevel === 'UG' && styles.activeChipText,
                        ]}
                      >
                        UG
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        studentCourseLevel === 'PG' && {
                          backgroundColor: brandColor,
                          borderColor: brandColor,
                        },
                      ]}
                      onPress={() => setStudentCourseLevel('PG')}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          studentCourseLevel === 'PG' && styles.activeChipText,
                        ]}
                      >
                        PG
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inputBox, { flex: 1 }]}
                      onPress={() => setShowDeptPicker(true)}
                    >
                      <Text style={[styles.input, { paddingTop: 14 }]}>
                        {studentDepartment || 'Dept'}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={18} color={Colors.slate500} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={20} color={Colors.slate400} />
                <TextInput
                  style={styles.input}
                  value={isTeacher ? teacherRegPassword : studentRegPassword}
                  onChangeText={
                    isTeacher ? setTeacherRegPassword : setStudentRegPassword
                  }
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.slate400}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: brandColor }]}
              onPress={handleRegisterStep1}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Continue to Verification</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Department Picker Modal */}
      <GguDepartmentPicker
        visible={showDeptPicker}
        onClose={() => setShowDeptPicker(false)}
        brandColor={brandColor}
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
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
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
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    marginBottom: 18,
  },
  demoFillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: Colors.slate50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.slate800,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.slate200,
    backgroundColor: Colors.slate50,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate600,
  },
  activeChipText: {
    color: Colors.white,
  },
});
