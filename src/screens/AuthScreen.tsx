import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  BackHandler,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { GguDepartmentPicker } from '../components/GguDepartmentPicker';
import { ALL_GGU_DEPARTMENTS } from '../data/gguUniversityData';
import { api, setAuthToken } from '../services/api';
import { saveAuthSession } from '../services/sessionStorage';
import { getUniqueDeviceId } from '../services/deviceService';

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
    teacherDesignation,
    setTeacherDesignation,
    teacherPhone,
    setTeacherPhone,
    teacherOfficeRoom,
    setTeacherOfficeRoom,
    uploadedTeacherIdCardName,
    isTeacherIdCardUploading,
    uploadAndExtractTeacherIdCard,
    resetTeacherIdUpload,
    uploadedTeacherTimetableDocName,
    isTeacherTimetableUploading,
    extractedTeacherClasses,
    uploadAndExtractTeacherTimetable,
    resetTeacherTimetableUpload,
    uploadedPdfName,
    isPdfUploading,
    studentEnrolledCourses,
    setStudentEnrolledCourses,
    uploadAndExtractPdf,
    navigateTo,
    goBack,
    setUserNotification,
    setTeacherDailySchedule,
  } = useAttendance();

  const [showPassword, setShowPassword] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(true);
  const [focusedLoginField, setFocusedLoginField] = useState<string | null>(null);

  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  // Selected department details for display
  const activeDeptVal = isTeacher ? teacherDepartment : studentDepartment;
  const currentDeptObj = ALL_GGU_DEPARTMENTS.find(
    (d) => d.code === activeDeptVal || d.name === activeDeptVal
  ) || (activeDeptVal ? {
    code: activeDeptVal,
    name: activeDeptVal,
    school: 'Guru Ghasidas Vishwavidyalaya',
  } : null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  // Student Semester Selection State (1st Sem by default for new students)
  const [studentRegSemester, setStudentRegSemester] = useState('1ST SEMESTER');

  const handleSelectSemester = (semVal: string) => {
    setStudentRegSemester(semVal);
  };

  React.useEffect(() => {
    if (studentCourseLevel) {
      if (/3RD|SEM\s*3|SEMESTER\s*3/i.test(studentCourseLevel)) {
        setStudentRegSemester('3RD SEMESTER');
      } else if (/1ST|SEM\s*1|SEMESTER\s*1/i.test(studentCourseLevel)) {
        setStudentRegSemester('1ST SEMESTER');
      } else if (/2ND|SEM\s*2|SEMESTER\s*2/i.test(studentCourseLevel)) {
        setStudentRegSemester('2ND SEMESTER');
      } else if (/4TH|SEM\s*4|SEMESTER\s*4/i.test(studentCourseLevel)) {
        setStudentRegSemester('4TH SEMESTER');
      }
    } else if (studentRegEnrollment) {
      if (/GGV\/23\//i.test(studentRegEnrollment) || studentRegEnrollment.includes('/23/')) {
        setStudentRegSemester('3RD SEMESTER');
      } else if (/GGV\/25\//i.test(studentRegEnrollment) || studentRegEnrollment.includes('/25/')) {
        setStudentRegSemester('1ST SEMESTER');
      }
    }
  }, [studentCourseLevel, studentRegEnrollment]);

  // Forgot / Reset Password state with 2-step OTP Authentication
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowNewPass, setForgotShowNewPass] = useState(false);
  const [forgotShowConfirmPass, setForgotShowConfirmPass] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState<string | null>(null);

  const openForgotPasswordModal = () => {
    const currentId = (isTeacher ? teacherFacultyId : studentEnrollment).trim();
    setForgotStep(1);
    setForgotIdentifier(currentId);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotShowNewPass(false);
    setForgotShowConfirmPass(false);
    setForgotErrorMsg(null);
    setForgotSuccessMsg(null);
    setForgotMaskedEmail(null);
    setIsForgotModalVisible(true);
  };

  // Animate forgot password modal smoothly
  const modalScaleAnim = useRef(new Animated.Value(0.92)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isForgotModalVisible) {
      modalScaleAnim.setValue(0.92);
      modalOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isForgotModalVisible]);

  // Hardware Back Press handling for modals and Register tab inside AuthScreen
  useEffect(() => {
    const onBackPress = () => {
      if (isForgotModalVisible) {
        setIsForgotModalVisible(false);
        return true;
      }
      if (authTab === 'REGISTER') {
        setAuthTab('LOGIN');
        return true;
      }
      return false; // propagate to root handler to navigate to ROLE_SELECTION
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isForgotModalVisible, authTab]);

  const handleSendOtp = async () => {
    const trimmedId = forgotIdentifier.trim();
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedId) {
      setForgotErrorMsg(`Please enter your ${isTeacher ? 'Faculty ID' : 'Enrollment Number'}.`);
      return;
    }
    if (!trimmedEmail) {
      setForgotErrorMsg('Please enter your registered university email address.');
      return;
    }

    setIsSendingOtp(true);
    setForgotErrorMsg(null);
    setForgotSuccessMsg(null);

    try {
      const res = await api.sendResetOtp(trimmedId, trimmedEmail, isTeacher ? 'TEACHER' : 'STUDENT');
      if (res && res.success) {
        setForgotMaskedEmail(res.maskedEmail || trimmedEmail);
        setForgotSuccessMsg(res.message || 'Verification code sent to your registered email.');
        setForgotOtp(''); // Keep completely empty for manual user entry
        setForgotStep(2);
      } else {
        setForgotErrorMsg(res?.message || 'Verification failed. Please verify your ID and registered email.');
      }
    } catch (err: any) {
      setForgotErrorMsg(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    const trimmedId = forgotIdentifier.trim();
    const trimmedEmail = forgotEmail.trim();
    const trimmedOtp = forgotOtp.trim();

    if (!trimmedOtp || trimmedOtp.length < 6) {
      setForgotErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!forgotNewPassword) {
      setForgotErrorMsg('Please enter a new password.');
      return;
    }
    if (forgotNewPassword.length < 4) {
      setForgotErrorMsg('New password must be at least 4 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsResettingPass(true);
    setForgotErrorMsg(null);
    setForgotSuccessMsg(null);

    try {
      const res = await api.resetPassword(
        trimmedId,
        trimmedEmail,
        trimmedOtp,
        forgotNewPassword,
        isTeacher ? 'TEACHER' : 'STUDENT'
      );
      if (res && res.success) {
        setForgotSuccessMsg(res.message || 'Password authenticated and reset successfully!');
        if (isTeacher) {
          setTeacherFacultyId(trimmedId);
          setTeacherPassword(forgotNewPassword);
        } else {
          setStudentEnrollment(trimmedId);
          setStudentPassword(forgotNewPassword);
        }
        setUserNotification('Password updated successfully! Tap Sign In to proceed.');
        setTimeout(() => {
          setIsForgotModalVisible(false);
        }, 1500);
      } else {
        setForgotErrorMsg(res?.message || 'Could not reset password. Please check your verification code.');
      }
    } catch (err: any) {
      setForgotErrorMsg(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setIsResettingPass(false);
    }
  };

  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const showErrorModal = (
    title: string,
    message: string,
    type: 'error' | 'warning' | 'info' = 'error'
  ) => {
    setErrorModal({
      visible: true,
      title: title || 'Invalid Credentials',
      message: message || 'Invalid credentials. Please verify your ID and password.',
      type,
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      try {
        window.alert(`${title}\n\n${message}`);
      } catch (e) {
        // window.alert fallback if needed
      }
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    const identifier = (isTeacher ? teacherFacultyId : studentEnrollment).trim();
    const password = isTeacher ? teacherPassword : studentPassword;

    if (!identifier || !password) {
      const field = isTeacher ? 'Faculty ID' : 'Enrollment Number';
      const msg = `Please enter your ${field} and password.`;
      setLoginErrorMessage(msg);
      showErrorModal('Credentials Required', msg, 'warning');
      return;
    }

    setIsLoggingIn(true);
    setLoginErrorMessage(null);
    setUserNotification('Checking credentials with database...');

    // Safety watchdog: Guarantee UI returns to interactive state within 7s
    const safetyTimer = setTimeout(() => {
      setIsLoggingIn(false);
      setUserNotification('Login took too long. Please try again.');
    }, 7000);

    try {
      const deviceId = await getUniqueDeviceId();
      const res = await api.login(identifier, password, isTeacher ? 'TEACHER' : 'STUDENT', deviceId);
      clearTimeout(safetyTimer);
      if (res && res.success && res.user) {
        setLoginErrorMessage(null);
        if (res.token) {
          setAuthToken(res.token);
        }
        setUserNotification(`Welcome, ${res.user.name}!`);
        if (isTeacher) {
          const facId = res.user.facultyId || identifier;
          setTeacherRegName(res.user.name);
          setTeacherRegFacultyId(facId);
          setTeacherDepartment(res.user.department || '');
          if (res.user.email) {
            setTeacherRegEmail(res.user.email);
          }
          await saveAuthSession({
            role: 'TEACHER',
            token: res.token || null,
            teacherFacultyId: facId,
            teacherRegName: res.user.name,
            teacherDepartment: res.user.department || '',
            teacherRegEmail: res.user.email || '',
            savedAt: Date.now(),
          });
          try {
            const schedRes = await api.getTeacherSchedule(facId, 'Today');
            if (schedRes && schedRes.success && Array.isArray(schedRes.schedules) && schedRes.schedules.length > 0) {
              setTeacherDailySchedule(schedRes.schedules);
            }
          } catch (schedErr) {
            console.warn('Schedule fetch on login error:', schedErr);
          }
          navigateTo('TEACHER_DASHBOARD');
        } else {
          setStudentRegName(res.user.name);
          const enrollId = res.user.enrollmentNo || identifier;
          setStudentRegEnrollment(enrollId);
          setStudentEnrollment(enrollId);
          setStudentDepartment(res.user.department || '');
          if (res.user.courseLevel) {
            setStudentCourseLevel(res.user.courseLevel);
          }
          if (res.user.email) {
            setStudentRegEmail(res.user.email);
          }
          if (Array.isArray(res.user.enrolledCourses) && res.user.enrolledCourses.length > 0) {
            setStudentEnrolledCourses(res.user.enrolledCourses);
          }
          await saveAuthSession({
            role: 'STUDENT',
            token: res.token || null,
            studentEnrollment: enrollId,
            studentRegEnrollment: enrollId,
            studentRegName: res.user.name,
            studentDepartment: res.user.department || '',
            studentCourseLevel: res.user.courseLevel || '',
            studentRegEmail: res.user.email || '',
            studentEnrolledCourses: res.user.enrolledCourses || [],
            savedAt: Date.now(),
          });
          navigateTo('STUDENT_DASHBOARD');
        }
      } else {
        if (res?.isDeviceLocked) {
          const lockTitle = '🔒 Device Locked: New ID Blocked';
          const lockMsg =
            res?.message ||
            'Ek device se ek din me keval ek student login ho sakta hai. Is device par aaj pehle se ek student registered hai. Proxy attendance rokne ke liye raat 12:00 AM (Midnight) tak nayi ID se login nahi kiya ja sakta.';
          setLoginErrorMessage(lockMsg);
          showErrorModal(lockTitle, lockMsg, 'warning');
          setUserNotification('🚫 Device locked: New student login blocked until midnight');
        } else {
          const errorMsg =
            res?.message || 'Invalid credentials. User not found or password incorrect.';
          const isTimeout =
            errorMsg.toLowerCase().includes('timed out') ||
            errorMsg.toLowerCase().includes('server is running');
          const title = isTimeout ? 'Server Timeout' : 'Invalid Credentials';
          setLoginErrorMessage(errorMsg);
          showErrorModal(title, errorMsg, 'error');
          setUserNotification(`⚠️ ${errorMsg}`);
        }
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      const errorMsg = err?.message || 'Could not connect to authentication server.';
      setLoginErrorMessage(errorMsg);
      showErrorModal('Login Error', errorMsg, 'error');
    } finally {
      clearTimeout(safetyTimer);
      setIsLoggingIn(false);
    }
  };

  const handleRegisterNext = async () => {
    if (isTeacher) {
      if (!teacherRegName || !teacherRegFacultyId || !teacherRegPassword || !teacherDepartment) {
        Alert.alert(
          'Incomplete Details',
          'Please ensure Name, Faculty ID, Department, and Password are provided.'
        );
        return;
      }
      if (!teacherRegEmail || !teacherRegEmail.trim()) {
        Alert.alert(
          'Email Required',
          'Please enter your email address so you can receive verification codes.'
        );
        return;
      }

      const cleanFacultyId = teacherRegFacultyId.trim().toUpperCase();
      const cleanEmail = teacherRegEmail.trim().toLowerCase();

      // Check if Faculty ID or Email is already registered
      setIsCheckingAccount(true);
      try {
        const idCheck = await api.lookupUser(cleanFacultyId);
        if (idCheck && idCheck.success && idCheck.user) {
          setIsCheckingAccount(false);
          showErrorModal(
            'Already Registered',
            `Is Faculty ID (${cleanFacultyId}) se pehle se account bana hua hai.\n\nDubara naya account register nahi kiya ja sakta. Kripya Login karein ya Forgot Password use karein.`,
            'warning'
          );
          return;
        }

        const emailCheck = await api.lookupUser(cleanEmail);
        if (emailCheck && emailCheck.success && emailCheck.user) {
          setIsCheckingAccount(false);
          showErrorModal(
            'Email Already Registered',
            `Is Email (${cleanEmail}) se pehle se account bana hua hai.\n\nDubara naya account register nahi kiya ja sakta. Kripya Login karein ya Forgot Password use karein.`,
            'warning'
          );
          return;
        }
      } catch (err) {
        console.warn('Faculty account pre-check error:', err);
      } finally {
        setIsCheckingAccount(false);
      }
    } else {
      if (!studentRegName || !studentRegEnrollment || !studentRegPassword || !studentDepartment) {
        Alert.alert(
          'Incomplete Details',
          'Please ensure Name, Enrollment No., Department, and Password are provided.'
        );
        return;
      }
      if (!studentRegEmail || !studentRegEmail.trim()) {
        Alert.alert(
          'Email Required',
          'Please enter your active email address (Gmail or GGU) to receive OTP and verification.'
        );
        return;
      }

      const cleanEnrollment = studentRegEnrollment.trim().toUpperCase();
      const cleanEmail = studentRegEmail.trim().toLowerCase();

      // Check if Enrollment Number or Email is already registered
      setIsCheckingAccount(true);
      try {
        const idCheck = await api.lookupUser(cleanEnrollment);
        if (idCheck && idCheck.success && idCheck.user) {
          setIsCheckingAccount(false);
          showErrorModal(
            'Already Registered',
            `Is Enrollment Number (${cleanEnrollment}) se pehle se account bana hua hai.\n\nDubara naya ID register nahi ho sakta. Kripya Login tab par jaakar Log In karein ya Forgot Password use karein.`,
            'warning'
          );
          return;
        }

        const emailCheck = await api.lookupUser(cleanEmail);
        if (emailCheck && emailCheck.success && emailCheck.user) {
          setIsCheckingAccount(false);
          showErrorModal(
            'Email Already Registered',
            `Is Email (${cleanEmail}) se pehle se account bana hua hai.\n\nDubara naya ID register nahi ho sakta. Kripya Login tab par jaakar Log In karein ya Forgot Password use karein.`,
            'warning'
          );
          return;
        }
      } catch (err) {
        console.warn('Student account pre-check error:', err);
      } finally {
        setIsCheckingAccount(false);
      }

      const isPg = studentCourseLevel === 'PG';
      let degreeName = 'B.SC. (CS)';
      if (isPg) {
        if (studentDepartment && /BCA|MCA|APPLICATION/i.test(studentDepartment)) degreeName = 'MCA';
        else if (studentDepartment && /MGMT|MANAGEMENT/i.test(studentDepartment)) degreeName = 'MBA';
        else if (studentDepartment && /COMMERCE/i.test(studentDepartment)) degreeName = 'M.COM';
        else degreeName = `M.SC. (${studentDepartment || 'CS'})`;
      } else {
        const isBca = (studentRegEnrollment && studentRegEnrollment.includes('/251/')) ||
          (studentDepartment && /BCA|APPLICATION/i.test(studentDepartment));
        degreeName = isBca ? 'BCA' : 'B.SC. (CS)';
      }
      const sem = studentRegSemester || '1ST SEMESTER';
      setStudentCourseLevel(`${sem} • ${degreeName} (NEP 2020)`);
    }
    navigateTo('DOC_VERIFICATION');
  };

  const compressImageForFastOcr = async (file: any): Promise<any> => {
    if (!file || typeof window === 'undefined') return file;
    const isImage =
      (file.type && file.type.startsWith('image/')) ||
      (file.name && /\.(png|jpe?g|webp|bmp)$/i.test(file.name));
    if (!isImage) return file;

    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1200;
            let width = img.width;
            let height = img.height;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const cleanName = (file.name || 'document.png').replace(/\.[^.]+$/, '.jpg');
                    const compressed = new File([blob], cleanName, { type: 'image/jpeg' });
                    resolve(compressed);
                  } else {
                    resolve(file);
                  }
                },
                'image/jpeg',
                0.85
              );
            } else {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  };

  const handleBrowsePdf = async () => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*,.pdf,.png,.jpg,.jpeg';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const optimized = await compressImageForFastOcr(file);
            await uploadAndExtractPdf(optimized);
          }
          document.body.removeChild(input);
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadAndExtractPdf(file);
      }
    } catch (err) {
      console.warn('PDF picker error:', err);
      Alert.alert('File Selection', 'Could not open document picker. Please try again.');
    }
  };

  const handleBrowseTeacherIdCard = async () => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const optimized = await compressImageForFastOcr(file);
            await uploadAndExtractTeacherIdCard(optimized);
          }
          document.body.removeChild(input);
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadAndExtractTeacherIdCard(file);
      }
    } catch (err) {
      console.warn('Teacher ID picker error:', err);
      Alert.alert('File Selection', 'Could not open document picker.');
    }
  };

  const handleBrowseTeacherTimetable = async () => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const optimized = await compressImageForFastOcr(file);
            await uploadAndExtractTeacherTimetable(optimized);
          }
          document.body.removeChild(input);
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadAndExtractTeacherTimetable(file);
      }
    } catch (err) {
      console.warn('Timetable picker error:', err);
      Alert.alert('File Selection', 'Could not open document picker.');
    }
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

            <View style={styles.formContainer}>
              {isTeacher ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Faculty ID</Text>
                  <View style={[styles.inputBox, focusedLoginField === 'facultyId' && { borderColor: brandColor }]}>
                    <MaterialIcons name="badge" size={20} color={focusedLoginField === 'facultyId' ? brandColor : Colors.slate400} />
                    <TextInput
                      style={[styles.input, { outlineStyle: 'none' } as any]}
                      value={teacherFacultyId}
                      onChangeText={setTeacherFacultyId}
                      onFocus={() => setFocusedLoginField('facultyId')}
                      onBlur={() => setFocusedLoginField(null)}
                      placeholder="e.g. FAC-CS-8924"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Enrollment Number</Text>
                  <View style={[styles.inputBox, focusedLoginField === 'enrollment' && { borderColor: brandColor }]}>
                    <MaterialIcons name="school" size={20} color={focusedLoginField === 'enrollment' ? brandColor : Colors.slate400} />
                    <TextInput
                      style={[styles.input, { outlineStyle: 'none' } as any]}
                      value={studentEnrollment}
                      onChangeText={setStudentEnrollment}
                      onFocus={() => setFocusedLoginField('enrollment')}
                      onBlur={() => setFocusedLoginField(null)}
                      placeholder="e.g. GGV/25/250/0024"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={[styles.inputBox, focusedLoginField === 'password' && { borderColor: brandColor }]}>
                  <MaterialIcons name="lock" size={20} color={focusedLoginField === 'password' ? brandColor : Colors.slate400} />
                  <TextInput
                    style={[styles.input, { outlineStyle: 'none' } as any]}
                    value={isTeacher ? teacherPassword : studentPassword}
                    onChangeText={isTeacher ? setTeacherPassword : setStudentPassword}
                    onFocus={() => setFocusedLoginField('password')}
                    onBlur={() => setFocusedLoginField(null)}
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
                onPress={openForgotPasswordModal}
              >
                <Text style={[styles.forgotPassText, { color: brandColor }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {loginErrorMessage ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={18} color={Colors.liveRed} />
                  <Text style={styles.errorBannerText}>{loginErrorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: brandColor, opacity: isLoggingIn ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={isLoggingIn}
                activeOpacity={0.85}
              >
                {isLoggingIn ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Log In to {isTeacher ? 'Teacher Dashboard' : 'Student Academic Hub'}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>

              {/* Bottom Switch to Register */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => setAuthTab('REGISTER')}
              >
                <Text style={styles.switchAuthText}>{isTeacher ? 'New faculty member? ' : 'New student? '}</Text>
                <Text style={[styles.switchAuthLink, { color: brandColor }]}>
                  {isTeacher
                    ? 'Register with Teacher ID Card & Timetable →'
                    : 'Register with Course Selection PDF →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isTeacher ? (
          /* ======================== TEACHER REGISTER VIEW ======================== */
          <View style={styles.registerWrapper}>
            <Text style={[styles.stepIndicatorText, { color: brandColor }]}>
              TEACHER REGISTRATION & TIMETABLE SYNC
            </Text>

            {/* STEP 1: UPLOAD TEACHER ID CARD */}
            <View
              style={[
                styles.pdfUploadCard,
                {
                  borderColor: uploadedTeacherIdCardName ? '#86EFAC' : '#FED7AA',
                  backgroundColor: uploadedTeacherIdCardName ? '#F0FDF4' : '#FFF7ED',
                },
              ]}
            >
              <View style={styles.pdfHeaderRow}>
                <View
                  style={[
                    styles.pdfIconBadge,
                    {
                      backgroundColor: uploadedTeacherIdCardName ? '#DCFCE7' : '#FFEDD5',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={uploadedTeacherIdCardName ? 'check-circle' : 'badge'}
                    size={22}
                    color={uploadedTeacherIdCardName ? '#16A34A' : brandColor}
                  />
                </View>

                <View style={styles.pdfTitleColumn}>
                  <Text style={styles.pdfCardTitle}>
                    STEP 1: Upload Official Teacher ID Card
                  </Text>
                  <Text
                    style={[
                      styles.pdfCardSubtitle,
                      { color: uploadedTeacherIdCardName ? '#15803D' : Colors.slate500 },
                    ]}
                  >
                    {uploadedTeacherIdCardName
                      ? `Verified ID Card: ${uploadedTeacherIdCardName}`
                      : 'Upload GGU Faculty ID to auto-fetch personal details'}
                  </Text>
                </View>

                {isTeacherIdCardUploading && (
                  <ActivityIndicator size="small" color={brandColor} />
                )}
              </View>

              {/* Action Buttons: Browse Teacher ID */}
              <View style={styles.pdfButtonsRow}>
                <TouchableOpacity
                  style={[styles.browsePdfBtn, { backgroundColor: brandColor, flex: 1, paddingVertical: 12 }]}
                  onPress={handleBrowseTeacherIdCard}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="upload-file" size={19} color={Colors.white} />
                  <Text style={[styles.browsePdfBtnText, { fontSize: 14, fontWeight: '700' }]}>
                    Browse & Upload Teacher ID Card
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Verified Teacher ID Card Preview */}
              {uploadedTeacherIdCardName && (
                <View style={styles.teacherIdPreviewCard}>
                  <View style={styles.teacherIdHeader}>
                    <View style={[styles.gguEmblemMini, { backgroundColor: brandColor }]}>
                      <MaterialIcons name="account-balance" size={13} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherIdUniName}>GURU GHASIDAS VISHWAVIDYALAYA</Text>
                      <Text style={[styles.teacherIdSubTitle, { color: brandColor }]}>
                        FACULTY IDENTITY SMART CARD • BILASPUR (C.G.)
                      </Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={13} color="#16A34A" />
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                    </View>
                  </View>

                  <View style={styles.teacherIdBody}>
                    <View style={styles.teacherPhotoMock}>
                      <MaterialIcons name="person" size={32} color={Colors.slate400} />
                    </View>
                    <View style={styles.teacherIdInfoCol}>
                      <Text style={styles.teacherCardName}>
                        {teacherRegName || 'Enter Full Name in Step 3'}
                      </Text>
                      <Text style={styles.teacherCardDesig}>
                        {teacherDesignation || 'Faculty Member'} • {teacherRegFacultyId || 'FAC-ID'}
                      </Text>
                      <Text style={styles.teacherCardDept}>
                        Dept of {teacherDepartment || 'CSIT'}
                      </Text>
                      <View style={styles.teacherCardDetailsRow}>
                        <Text style={styles.teacherCardMeta}>
                          ✉️ {teacherRegEmail || 'Official Email'}
                        </Text>
                        <Text style={styles.teacherCardMeta}>
                          📞 {teacherPhone || 'Contact No.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* STEP 2: UPLOAD TEACHER TIME TABLE */}
            <View
              style={[
                styles.pdfUploadCard,
                {
                  borderColor: uploadedTeacherTimetableDocName ? '#86EFAC' : '#FED7AA',
                  backgroundColor: uploadedTeacherTimetableDocName ? '#F0FDF4' : '#FFF7ED',
                },
              ]}
            >
              <View style={styles.pdfHeaderRow}>
                <View
                  style={[
                    styles.pdfIconBadge,
                    {
                      backgroundColor: uploadedTeacherTimetableDocName ? '#DCFCE7' : '#FFEDD5',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={uploadedTeacherTimetableDocName ? 'calendar-month' : 'schedule'}
                    size={22}
                    color={uploadedTeacherTimetableDocName ? '#16A34A' : brandColor}
                  />
                </View>

                <View style={styles.pdfTitleColumn}>
                  <Text style={styles.pdfCardTitle}>
                    STEP 2: Upload Official Teaching Time Table
                  </Text>
                  <Text
                    style={[
                      styles.pdfCardSubtitle,
                      { color: uploadedTeacherTimetableDocName ? '#15803D' : Colors.slate500 },
                    ]}
                  >
                    {uploadedTeacherTimetableDocName
                      ? `Schedule Synced: ${uploadedTeacherTimetableDocName}`
                      : 'Upload timetable to auto-fetch classes & timings'}
                  </Text>
                </View>

                {isTeacherTimetableUploading && (
                  <ActivityIndicator size="small" color={brandColor} />
                )}
              </View>

              {/* Action Buttons: Browse Timetable */}
              <View style={styles.pdfButtonsRow}>
                <TouchableOpacity
                  style={[styles.browsePdfBtn, { backgroundColor: brandColor, flex: 1, paddingVertical: 12 }]}
                  onPress={handleBrowseTeacherTimetable}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="folder-open" size={19} color={Colors.white} />
                  <Text style={[styles.browsePdfBtnText, { fontSize: 14, fontWeight: '700' }]}>
                    Browse & Upload Teaching Timetable
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Auto-Fetched Classes List */}
              {extractedTeacherClasses.length > 0 && (
                <View style={styles.extractedCoursesContainer}>
                  <View style={styles.extractedClassesHeaderRow}>
                    <Text style={styles.extractedCoursesLabel}>
                      Auto-Fetched Classes & Lectures ({extractedTeacherClasses.length} Sessions):
                    </Text>
                    <View style={styles.syncStatusChip}>
                      <MaterialIcons name="sync" size={12} color="#15803D" />
                      <Text style={styles.syncStatusChipText}>Auto-Synced</Text>
                    </View>
                  </View>

                  <View style={styles.classesListGrid}>
                    {extractedTeacherClasses.map((item, idx) => (
                      <View key={item.id || idx} style={styles.extractedClassCard}>
                        <View style={styles.classCardTopRow}>
                          <View style={styles.classCodeBadge}>
                            <Text style={styles.classCodeText}>{item.courseCode}</Text>
                          </View>
                          <View style={styles.classTypeBadge}>
                            <Text style={styles.classTypeText}>
                              {item.courseType} • {item.credits} Cr
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.classCardTitle} numberOfLines={1}>
                          {item.courseName}
                        </Text>
                        <View style={styles.classCardMetaRow}>
                          <View style={styles.classMetaItem}>
                            <MaterialIcons name="access-time" size={13} color={Colors.slate500} />
                            <Text style={styles.classMetaText}>{item.timeSlot}</Text>
                          </View>
                          <View style={styles.classMetaItem}>
                            <MaterialIcons name="room" size={13} color={Colors.slate500} />
                            <Text style={styles.classMetaText}>{item.classroom}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* STEP 3: VERIFY AUTO-FILLED PROFILE DETAILS */}
            <Text style={styles.step2HeaderTitle}>
              STEP 3: Verify Auto-Filled Faculty Profile Details
            </Text>

            <View style={styles.profileFieldsContainer}>
              {/* Field 1: Name */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Full Name (Auto-Fetched from ID)</Text>
                <View
                  style={[
                    styles.textInputCard,
                    isNameFocused && { borderColor: brandColor, borderWidth: 1.8 },
                  ]}
                >
                  <TextInput
                    style={styles.textInputFilled}
                    value={teacherRegName}
                    onChangeText={setTeacherRegName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="e.g. Dr. Full Name (or upload ID card)"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>
              </View>

              {/* Field 2: Faculty ID */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Faculty ID / Employee Code</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={teacherRegFacultyId}
                    onChangeText={setTeacherRegFacultyId}
                    placeholder="e.g. FAC-XXXX (or upload ID card)"
                    placeholderTextColor={Colors.slate400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Field 3: Designation */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Designation</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={teacherDesignation}
                    onChangeText={setTeacherDesignation}
                    placeholder="e.g. Assistant / Associate Professor"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>
              </View>

              {/* Field 4: Department */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Department (GGU Official)</Text>
                <TouchableOpacity
                  style={styles.deptPickerCard}
                  onPress={() => setShowDeptPicker(true)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.deptBadge, !currentDeptObj && { backgroundColor: Colors.slate100 }]}>
                    <Text style={[styles.deptBadgeText, !currentDeptObj && { color: Colors.slate500 }]}>
                      {currentDeptObj ? currentDeptObj.code : 'SELECT'}
                    </Text>
                  </View>
                  <View style={styles.deptTextColumn}>
                    <Text
                      style={[
                        styles.deptNameText,
                        !currentDeptObj && { color: Colors.slate400, fontWeight: '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {currentDeptObj ? currentDeptObj.name : 'Select Official Department'}
                    </Text>
                    <Text style={styles.deptSchoolText} numberOfLines={1}>
                      {currentDeptObj ? currentDeptObj.school : 'Tap to choose from 32+ GGU Departments'}
                    </Text>
                  </View>
                  <MaterialIcons name="arrow-drop-down" size={22} color={Colors.slate500} />
                </TouchableOpacity>
              </View>

              {/* Field 5: Email */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Official Email Address</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={teacherRegEmail}
                    onChangeText={setTeacherRegEmail}
                    placeholder="e.g. faculty@ggu.ac.in"
                    placeholderTextColor={Colors.slate400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Field 6: Mobile Number */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={teacherPhone}
                    onChangeText={setTeacherPhone}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={Colors.slate400}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Field 7: Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={[styles.textInputFilled, { flex: 1 }]}
                    value={teacherRegPassword}
                    onChangeText={setTeacherRegPassword}
                    placeholder="Create password (min. 4 characters)"
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

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: brandColor, marginTop: 12 },
                  isCheckingAccount && { opacity: 0.7 },
                ]}
                onPress={handleRegisterNext}
                activeOpacity={0.85}
                disabled={isCheckingAccount}
              >
                {isCheckingAccount ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Checking Database...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>
              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => setAuthTab('LOGIN')}
              >
                <Text style={styles.switchAuthText}>Already registered faculty? </Text>
                <Text style={[styles.switchAuthLink, { color: brandColor }]}>
                  Log In instead →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================== STUDENT REGISTER VIEW ======================== */
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
                    STEP 1: Upload Course Selection PDF
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
                  style={[styles.browsePdfBtn, { backgroundColor: brandColor, flex: 1, paddingVertical: 12 }]}
                  onPress={handleBrowsePdf}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="upload-file" size={20} color={Colors.white} />
                  <Text style={[styles.browsePdfBtnText, { fontSize: 14, fontWeight: '700' }]}>
                    Browse & Upload PDF
                  </Text>
                </TouchableOpacity>
              </View>



              {/* Auto-Extracted Courses Preview */}
              {studentEnrolledCourses.length > 0 && (
                <View style={styles.extractedCoursesContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[styles.extractedCoursesLabel, { marginBottom: 0 }]}>
                      Auto-Detected Subjects ({studentEnrolledCourses.length}):
                    </Text>
                    <View style={{ backgroundColor: Colors.emeraldCheck + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.emeraldCheck }}>Verified via PDF</Text>
                    </View>
                  </View>

                  <View style={{ gap: 6, marginTop: 4 }}>
                    {studentEnrolledCourses.map((c, index) => {
                      const code = typeof c === 'string'
                        ? (c.includes(':') ? c.split(':')[0].trim() : c)
                        : (c.courseCode || `C${index + 1}`);
                      const name = typeof c === 'string'
                        ? (c.includes(':') ? c.split(':').slice(1).join(':').trim() : '')
                        : (c.courseName || '');
                      const credits = typeof c === 'object' && c.credits ? `${c.credits} Cr` : '';
                      const type = typeof c === 'object' && c.type ? c.type : '';

                      return (
                        <View
                          key={`${code}-${index}`}
                          style={{
                            backgroundColor: Colors.white,
                            borderRadius: 10,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: Colors.slate200,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                              style={{
                                backgroundColor: brandColor,
                                paddingHorizontal: 7,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '800' }}>
                                {code}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{ fontSize: 12.5, fontWeight: '700', color: Colors.slate800 }}
                                numberOfLines={1}
                              >
                                {name || code}
                              </Text>
                              {(type || credits) ? (
                                <Text style={{ fontSize: 10.5, color: Colors.slate500, marginTop: 1 }}>
                                  {[type, credits].filter(Boolean).join(' • ')}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <MaterialIcons name="check-circle" size={18} color={Colors.emeraldCheck} />
                        </View>
                      );
                    })}
                  </View>
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
                    isNameFocused && { borderColor: brandColor },
                  ]}
                >
                  <TextInput
                    style={[styles.textInputFilled, { outlineStyle: 'none' } as any]}
                    value={studentRegName}
                    onChangeText={setStudentRegName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="e.g. Student Full Name (or upload slip)"
                    placeholderTextColor={Colors.slate400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Field 2: Enrollment No. */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Enrollment No.</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={studentRegEnrollment}
                    onChangeText={setStudentRegEnrollment}
                    placeholder="e.g. GGV/XX/XXX/XXXX (or upload slip)"
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
                  <View style={[styles.deptBadge, !currentDeptObj && { backgroundColor: Colors.slate100 }]}>
                    <Text style={[styles.deptBadgeText, !currentDeptObj && { color: Colors.slate500 }]}>
                      {currentDeptObj ? currentDeptObj.code : 'SELECT'}
                    </Text>
                  </View>

                  <View style={styles.deptTextColumn}>
                    <Text
                      style={[
                        styles.deptNameText,
                        !currentDeptObj && { color: Colors.slate400, fontWeight: '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {currentDeptObj ? currentDeptObj.name : 'Select Official Department'}
                    </Text>
                    <Text style={styles.deptSchoolText} numberOfLines={1}>
                      {currentDeptObj ? currentDeptObj.school : 'Tap to choose from 32+ GGU Departments'}
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
                <Text style={styles.fieldLabel}>Active Email Address</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={styles.textInputFilled}
                    value={studentRegEmail}
                    onChangeText={setStudentRegEmail}
                    placeholder="Enter your active personal or university email"
                    placeholderTextColor={Colors.slate400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Field 5: Course (UG / PG Radio Buttons) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Course Level</Text>
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
                        (studentCourseLevel !== 'PG') && { borderColor: brandColor },
                      ]}
                    >
                      {studentCourseLevel !== 'PG' && (
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
                        studentCourseLevel !== 'PG' && styles.radioLabelTextActive,
                      ]}
                    >
                      Undergraduate (UG - 8 Semesters)
                    </Text>
                  </TouchableOpacity>

                  {/* Radio PG */}
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => {
                      setStudentCourseLevel('PG');
                      if (['5TH SEMESTER', '6TH SEMESTER', '7TH SEMESTER', '8TH SEMESTER'].includes(studentRegSemester)) {
                        setStudentRegSemester('1ST SEMESTER');
                      }
                    }}
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
                      Postgraduate (PG - 4 Semesters)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 5.5: Semester Selection (Up to 8th for UG, 4th for PG) */}
              <View style={styles.fieldBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.fieldLabel}>Academic Semester</Text>
                  <Text style={{ fontSize: 11, color: Colors.slate500, fontWeight: '600' }}>
                    {studentCourseLevel === 'PG' ? 'PG: 1st to 4th Sem' : 'UG (NEP): 1st to 8th Sem'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {(studentCourseLevel === 'PG'
                    ? [
                        { label: '1st Sem', val: '1ST SEMESTER' },
                        { label: '2nd Sem', val: '2ND SEMESTER' },
                        { label: '3rd Sem', val: '3RD SEMESTER' },
                        { label: '4th Sem', val: '4TH SEMESTER' },
                      ]
                    : [
                        { label: '1st Sem', val: '1ST SEMESTER' },
                        { label: '2nd Sem', val: '2ND SEMESTER' },
                        { label: '3rd Sem', val: '3RD SEMESTER' },
                        { label: '4th Sem', val: '4TH SEMESTER' },
                        { label: '5th Sem', val: '5TH SEMESTER' },
                        { label: '6th Sem', val: '6TH SEMESTER' },
                        { label: '7th Sem', val: '7TH SEMESTER' },
                        { label: '8th Sem', val: '8TH SEMESTER' },
                      ]
                  ).map((s) => {
                    const isSelected = studentRegSemester === s.val;
                    return (
                      <TouchableOpacity
                        key={s.val}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          backgroundColor: isSelected ? brandColor : Colors.white,
                          borderWidth: 1.5,
                          borderColor: isSelected ? brandColor : Colors.slate200,
                        }}
                        onPress={() => handleSelectSemester(s.val)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? Colors.white : Colors.slate700,
                          }}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Field 6: Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.textInputCard}>
                  <TextInput
                    style={[styles.textInputFilled, { flex: 1 }]}
                    value={studentRegPassword}
                    onChangeText={setStudentRegPassword}
                    placeholder="Create password (min. 4 characters)"
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
                style={[
                  styles.primaryButton,
                  { backgroundColor: brandColor, marginTop: 12 },
                  isCheckingAccount && { opacity: 0.7 },
                ]}
                onPress={handleRegisterNext}
                activeOpacity={0.85}
                disabled={isCheckingAccount}
              >
                {isCheckingAccount ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Checking Database...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                  </>
                )}
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

      {/* Invalid Credentials & Alert Modal Popup */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalCard}>
            <View
              style={[
                styles.alertIconCircle,
                {
                  backgroundColor:
                    errorModal.type === 'warning'
                      ? 'rgba(217, 119, 6, 0.12)'
                      : errorModal.type === 'info'
                      ? 'rgba(15, 135, 172, 0.12)'
                      : 'rgba(220, 38, 38, 0.12)',
                },
              ]}
            >
              <MaterialIcons
                name={
                  errorModal.type === 'warning'
                    ? 'warning-amber'
                    : errorModal.type === 'info'
                    ? 'info-outline'
                    : 'lock-outline'
                }
                size={34}
                color={
                  errorModal.type === 'warning'
                    ? Colors.warningAmber
                    : errorModal.type === 'info'
                    ? Colors.studentTeal
                    : Colors.liveRed
                }
              />
            </View>

            <Text style={styles.alertModalTitle}>{errorModal.title || 'Invalid Credentials'}</Text>

            <Text style={styles.alertModalMessage}>
              {errorModal.message ||
                'The credentials you entered do not match our university records. Please verify and try again.'}
            </Text>

            <TouchableOpacity
              style={[
                styles.alertModalBtn,
                {
                  backgroundColor:
                    errorModal.type === 'warning'
                      ? Colors.warningAmber
                      : errorModal.type === 'info'
                      ? Colors.studentTeal
                      : Colors.liveRed,
                },
              ]}
              onPress={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
              activeOpacity={0.85}
            >
              <Text style={styles.alertModalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot / Reset Password Modal */}
      <Modal
        visible={isForgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsForgotModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <Animated.View
            style={[
              styles.resetModalCard,
              { transform: [{ scale: modalScaleAnim }], opacity: modalOpacityAnim },
            ]}
          >
            <View style={styles.resetModalHeader}>
              <View style={[styles.resetIconBadge, { backgroundColor: isTeacher ? '#FEF3C7' : '#DCFCE7' }]}>
                <MaterialIcons name={forgotStep === 1 ? 'verified-user' : 'lock-reset'} size={24} color={brandColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resetModalTitle}>
                  {forgotStep === 1 ? 'Verify Identity (Step 1/2)' : 'Set New Password (Step 2/2)'}
                </Text>
                <Text style={styles.resetModalSubtitle}>
                  {forgotStep === 1
                    ? `Enter your ${isTeacher ? 'Faculty ID' : 'Enrollment No'} and registered GGU email`
                    : `Enter the 6-digit code sent to ${forgotMaskedEmail || forgotEmail}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsForgotModalVisible(false)}
                style={styles.resetModalCloseBtn}
              >
                <MaterialIcons name="close" size={22} color={Colors.slate400} />
              </TouchableOpacity>
            </View>

            {/* Error banner */}
            {forgotErrorMsg ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color={Colors.liveRed} />
                <Text style={styles.errorBannerText}>{forgotErrorMsg}</Text>
              </View>
            ) : null}

            {/* Success banner */}
            {forgotSuccessMsg ? (
              <View style={styles.resetSuccessBanner}>
                <MaterialIcons name="check-circle" size={18} color="#16A34A" />
                <Text style={styles.resetSuccessBannerText}>{forgotSuccessMsg}</Text>
              </View>
            ) : null}

            {forgotStep === 1 ? (
              /* ================= STEP 1: IDENTITY & REGISTERED EMAIL ================= */
              <View>
                {/* Identifier input */}
                <View style={[styles.inputGroup, { marginBottom: 12 }]}>
                  <Text style={styles.fieldLabel}>
                    {isTeacher ? 'FACULTY ID' : 'ENROLLMENT NUMBER'}
                  </Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="badge" size={20} color={brandColor} />
                    <TextInput
                      style={styles.input}
                      value={forgotIdentifier}
                      onChangeText={(text) => {
                        setForgotIdentifier(text);
                        if (forgotErrorMsg) setForgotErrorMsg(null);
                      }}
                      placeholder={isTeacher ? 'e.g. TCH-CS-001' : 'e.g. GGV/25/250/0024'}
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Registered Email input */}
                <View style={[styles.inputGroup, { marginBottom: 18 }]}>
                  <Text style={styles.fieldLabel}>REGISTERED GGU / PERSONAL EMAIL</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="email" size={20} color={brandColor} />
                    <TextInput
                      style={styles.input}
                      value={forgotEmail}
                      onChangeText={(text) => {
                        setForgotEmail(text);
                        if (forgotErrorMsg) setForgotErrorMsg(null);
                      }}
                      placeholder="e.g. yourname@ggu.ac.in or gmail"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.resetModalActions}>
                  <TouchableOpacity
                    style={styles.resetCancelBtn}
                    onPress={() => setIsForgotModalVisible(false)}
                    disabled={isSendingOtp}
                  >
                    <Text style={styles.resetCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.resetSubmitBtn,
                      { backgroundColor: brandColor, opacity: isSendingOtp ? 0.7 : 1 },
                    ]}
                    onPress={handleSendOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.resetSubmitBtnText}>Send Verification OTP →</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ================= STEP 2: ENTER OTP & NEW PASSWORD ================= */
              <View>
                {/* 6-Digit OTP input */}
                <View style={[styles.inputGroup, { marginBottom: 12 }]}>
                  <Text style={styles.fieldLabel}>6-DIGIT VERIFICATION CODE (OTP)</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="security" size={20} color={brandColor} />
                    <TextInput
                      style={[styles.input, { letterSpacing: 3, fontWeight: '700' }]}
                      value={forgotOtp}
                      onChangeText={(text) => {
                        setForgotOtp(text);
                        if (forgotErrorMsg) setForgotErrorMsg(null);
                      }}
                      placeholder="• • • • • •"
                      placeholderTextColor={Colors.slate400}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>

                {/* New Password input */}
                <View style={[styles.inputGroup, { marginBottom: 12 }]}>
                  <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="lock-outline" size={20} color={brandColor} />
                    <TextInput
                      style={styles.input}
                      value={forgotNewPassword}
                      onChangeText={(text) => {
                        setForgotNewPassword(text);
                        if (forgotErrorMsg) setForgotErrorMsg(null);
                      }}
                      placeholder="At least 4 characters"
                      placeholderTextColor={Colors.slate400}
                      secureTextEntry={!forgotShowNewPass}
                    />
                    <TouchableOpacity onPress={() => setForgotShowNewPass(!forgotShowNewPass)}>
                      <MaterialIcons
                        name={forgotShowNewPass ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={Colors.slate400}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm New Password input */}
                <View style={[styles.inputGroup, { marginBottom: 18 }]}>
                  <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="lock-outline" size={20} color={brandColor} />
                    <TextInput
                      style={styles.input}
                      value={forgotConfirmPassword}
                      onChangeText={(text) => {
                        setForgotConfirmPassword(text);
                        if (forgotErrorMsg) setForgotErrorMsg(null);
                      }}
                      placeholder="Re-enter new password"
                      placeholderTextColor={Colors.slate400}
                      secureTextEntry={!forgotShowConfirmPass}
                    />
                    <TouchableOpacity onPress={() => setForgotShowConfirmPass(!forgotShowConfirmPass)}>
                      <MaterialIcons
                        name={forgotShowConfirmPass ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={Colors.slate400}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.resetModalActions}>
                  <TouchableOpacity
                    style={styles.resetCancelBtn}
                    onPress={() => {
                      setForgotStep(1);
                      setForgotErrorMsg(null);
                    }}
                    disabled={isResettingPass}
                  >
                    <Text style={styles.resetCancelBtnText}>← Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.resetSubmitBtn,
                      { backgroundColor: brandColor, opacity: isResettingPass ? 0.7 : 1 },
                    ]}
                    onPress={handleResetPasswordSubmit}
                    disabled={isResettingPass}
                  >
                    {isResettingPass ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.resetSubmitBtnText}>Authenticate & Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
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
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    borderWidth: 0,
    backgroundColor: 'transparent',
  } as any,
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
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    borderWidth: 0,
    backgroundColor: 'transparent',
  } as any,

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

  /* Teacher ID Card & Timetable Styles */
  teacherIdPreviewCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  teacherIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  gguEmblemMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherIdUniName: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.slate800,
    letterSpacing: 0.5,
  },
  teacherIdSubTitle: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  teacherIdBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teacherPhotoMock: {
    width: 48,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherIdInfoCol: {
    flex: 1,
    gap: 2,
  },
  teacherCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
  },
  teacherCardDesig: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.slate700,
  },
  teacherCardDept: {
    fontSize: 11,
    color: Colors.slate500,
  },
  teacherCardDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  teacherCardMeta: {
    fontSize: 10,
    color: Colors.slate500,
    fontWeight: '500',
  },

  extractedClassesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncStatusChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  classesListGrid: {
    gap: 8,
    marginTop: 4,
  },
  extractedClassCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 4,
  },
  classCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classCodeBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  classTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  classCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 2,
  },
  classCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  classMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classMetaText: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '500',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  alertModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 26,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  alertIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertModalMessage: {
    fontSize: 14,
    color: Colors.slate600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  alertModalBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.liveRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  alertModalBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.liveRed,
    fontWeight: '500',
  },
  resetModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  resetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  resetIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
  },
  resetModalSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  resetModalCloseBtn: {
    padding: 6,
    borderRadius: 8,
  },
  resetSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  resetSuccessBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  resetModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  resetCancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.slate100,
  },
  resetCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate600,
  },
  resetSubmitBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  resetSubmitBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
