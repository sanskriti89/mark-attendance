import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { api, setAuthToken } from '../services/api';

export const DocumentVerificationScreen: React.FC = () => {
  const {
    currentRole,
    navigateTo,
    studentRegName,
    studentRegEnrollment,
    studentRegEmail,
    setStudentRegEmail,
    studentRegPassword,
    studentCourseLevel,
    studentEnrolledCourses,
    teacherRegName,
    teacherRegFacultyId,
    teacherRegEmail,
    setTeacherRegEmail,
    teacherRegPassword,
    teacherDesignation,
    teacherPhone,
    teacherOfficeRoom,
    studentDepartment,
    teacherDepartment,
    uploadedTeacherIdCardName,
    uploadedTeacherTimetableDocName,
    extractedTeacherClasses,
    setUserNotification,
  } = useAttendance();
  const [docUploaded, setDocUploaded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(title ? `${title}\n\n${message || ''}` : message);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleCompleteRegistration = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    setUserNotification('Saving registration in database...');
    try {
      if (isTeacher) {
        const payload = {
          name: teacherRegName,
          facultyId: teacherRegFacultyId,
          email: (teacherRegEmail || '').trim(),
          password: teacherRegPassword,
          department: teacherDepartment,
          designation: teacherDesignation || 'Assistant Professor',
          phone: teacherPhone || '',
          officeRoom: teacherOfficeRoom || '',
          schedules: extractedTeacherClasses || [],
          coursesTaught: extractedTeacherClasses?.map((c) => `${c.courseCode}: ${c.courseName}`) || [],
        };
        const res = await api.registerTeacher(payload);
        if (res && res.success) {
          if (res.token) setAuthToken(res.token);
          if (res.user && res.user.email) {
            setTeacherRegEmail(res.user.email);
          } else if (payload.email) {
            setTeacherRegEmail(payload.email);
          }
          if (extractedTeacherClasses && extractedTeacherClasses.length > 0) {
            try {
              await api.syncSchedule('TEACHER', teacherRegFacultyId, extractedTeacherClasses);
            } catch (syncErr) {
              console.warn('Schedule sync error:', syncErr);
            }
          }
          setUserNotification(`✅ Faculty registered successfully: ${teacherRegName}`);
          navigateTo('REGISTRATION_SUCCESS');
        } else {
          const msg = res?.message || 'Could not register teacher profile.';
          setErrorMessage(msg);
          showAlert('Registration Failed', msg);
          setUserNotification(`⚠️ ${msg}`);
        }
      } else {
        const payload = {
          name: studentRegName,
          enrollmentNo: studentRegEnrollment,
          email: (studentRegEmail || '').trim(),
          password: studentRegPassword,
          department: studentDepartment,
          courseLevel:
            studentCourseLevel && !['UG', 'PG', ''].includes(studentCourseLevel.trim())
              ? studentCourseLevel
              : (studentRegEnrollment && studentRegEnrollment.includes('/251/')) ||
                (studentDepartment && /BCA|APPLICATION/i.test(studentDepartment))
              ? '1ST SEMESTER • BCA (NEP 2020)'
              : '1ST SEMESTER • B.SC. (CS) (NEP 2020)',
          enrolledCourses: studentEnrolledCourses || [],
        };
        const res = await api.registerStudent(payload);
        if (res && res.success) {
          if (res.token) setAuthToken(res.token);
          if (res.user && res.user.email) {
            setStudentRegEmail(res.user.email);
          } else if (payload.email) {
            setStudentRegEmail(payload.email);
          }
          setUserNotification(`✅ Student registered successfully: ${studentRegName}`);
          navigateTo('REGISTRATION_SUCCESS');
        } else {
          const msg = res?.message || 'Could not register student profile.';
          setErrorMessage(msg);
          showAlert('Registration Failed', msg);
          setUserNotification(`⚠️ ${msg}`);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Network error while connecting to database.';
      setErrorMessage(msg);
      showAlert('Registration Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CommonTopBar title={isTeacher ? "Faculty Credential Verification" : "ID Verification"} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.badge, { color: brandColor }]}>
            {isTeacher ? 'FINAL VERIFICATION' : 'STEP 2 OF 2'}
          </Text>
          <Text style={styles.title}>
            {isTeacher ? 'Faculty ID & Timetable Verification' : 'Student Identity Card'}
          </Text>
          <Text style={styles.subtitle}>
            {isTeacher
              ? 'Verify your official Guru Ghasidas Vishwavidyalaya Faculty Smart Card and auto-fetched teaching schedule.'
              : 'Upload or scan your official Guru Ghasidas Vishwavidyalaya institutional identity card.'}
          </Text>
        </View>

        {/* 1. Verified ID Card Mock */}
        <View style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="credit-card" size={24} color={brandColor} />
            <Text style={styles.cardTitle}>
              {isTeacher ? 'GGU Faculty Institutional Smart ID' : 'GGU Institutional Smart Card'}
            </Text>
          </View>

          <View style={styles.previewBox}>
            <MaterialIcons name="check-circle" size={44} color={Colors.emeraldCheck} />
            <Text style={styles.previewTitle}>
              {isTeacher ? 'Faculty ID Verified & Matched' : 'Document Verified'}
            </Text>
            <Text style={styles.previewSub}>
              {isTeacher
                ? `${teacherRegFacultyId} • ${teacherRegName}`
                : `${studentRegEnrollment} • ${studentRegName}`}
            </Text>
            <Text style={styles.deptSub}>
              {isTeacher ? `${teacherDesignation} • ` : ''}Dept of {isTeacher ? teacherDepartment : studentDepartment} • GGU Bilaspur
            </Text>
            {!isTeacher && (
              <View style={[styles.verifiedDocChip, { backgroundColor: brandColor + '15', marginTop: 6 }]}>
                <MaterialIcons name="school" size={14} color={brandColor} />
                <Text style={[styles.verifiedDocChipText, { color: brandColor, fontWeight: '700' }]}>
                  {studentCourseLevel || ((studentRegEnrollment && studentRegEnrollment.includes('/251/')) || (studentDepartment && /BCA|APPLICATION/i.test(studentDepartment)) ? '1ST SEMESTER • BCA (NEP 2020)' : '1ST SEMESTER • B.SC. (CS) (NEP 2020)')}
                </Text>
              </View>
            )}
            {isTeacher && uploadedTeacherIdCardName && (
              <View style={styles.verifiedDocChip}>
                <MaterialIcons name="attachment" size={13} color="#15803D" />
                <Text style={styles.verifiedDocChipText}>{uploadedTeacherIdCardName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.reuploadBtn}
            onPress={() =>
              Alert.alert('Scanner', 'Camera / OCR scan simulator is active.')
            }
          >
            <MaterialIcons name="camera-alt" size={18} color={brandColor} />
            <Text style={[styles.reuploadText, { color: brandColor }]}>
              Rescan / Re-upload ID Card
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. For Teacher: Extracted Timetable Verification Box */}
        {isTeacher && (
          <View style={styles.uploadCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="calendar-month" size={24} color={brandColor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Official Teaching Timetable Mapped</Text>
                <Text style={styles.cardSubtitleText}>
                  {uploadedTeacherTimetableDocName || 'GGU_Faculty_Workload_Timetable.pdf'}
                </Text>
              </View>
              <View style={styles.activePillBadge}>
                <Text style={styles.activePillBadgeText}>
                  {extractedTeacherClasses.length} Classes Synced
                </Text>
              </View>
            </View>

            <View style={styles.classesListCompact}>
              {extractedTeacherClasses.map((cls, idx) => (
                <View key={cls.id || idx} style={styles.classRowCompact}>
                  <View style={styles.classCodeCompactBadge}>
                    <Text style={styles.classCodeCompactText}>{cls.courseCode}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classNameCompactText} numberOfLines={1}>
                      {cls.courseName}
                    </Text>
                    <Text style={styles.classMetaCompactText}>
                      {cls.timeSlot} • {cls.classroom}
                    </Text>
                  </View>
                  <MaterialIcons name="check-circle" size={18} color="#16A34A" />
                </View>
              ))}
            </View>
          </View>
        )}



        {errorMessage && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: brandColor, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleCompleteRegistration}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                {isTeacher ? 'Complete Faculty Registration' : 'Complete Verification'}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.slate900,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 18,
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: Colors.slate200,
    borderRadius: 16,
    padding: 20,
    backgroundColor: Colors.slate50,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  previewBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate800,
  },
  previewSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
  },
  deptSub: {
    fontSize: 11,
    color: Colors.slate500,
    textAlign: 'center',
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  reuploadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checklist: {
    gap: 10,
    backgroundColor: Colors.successGreenLight,
    padding: 16,
    borderRadius: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.successGreen,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    marginTop: 10,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  verifiedDocChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  cardSubtitleText: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  activePillBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  classesListCompact: {
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  classRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classCodeCompactBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  classCodeCompactText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#C2410C',
  },
  classNameCompactText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.slate800,
  },
  classMetaCompactText: {
    fontSize: 10.5,
    color: Colors.slate500,
    marginTop: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
});
