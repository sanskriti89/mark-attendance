import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { api } from '../services/api';

export const ProfileModal: React.FC = () => {
  const {
    isProfileSheetOpen,
    setIsProfileSheetOpen,
    currentRole,
    studentRegName,
    studentEnrollment,
    studentDepartment,
    studentCourseLevel,
    studentEnrolledCourses,
    studentRegEmail,
    setStudentRegEmail,
    teacherRegName,
    teacherFacultyId,
    teacherDepartment,
    teacherRegEmail,
    setTeacherRegEmail,
    signOut,
  } = useAttendance();

  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  useEffect(() => {
    if (isProfileSheetOpen) {
      const activeId = isTeacher ? teacherFacultyId : studentEnrollment;
      const currentEmail = isTeacher ? teacherRegEmail : studentRegEmail;

      if (!currentEmail && activeId) {
        api.lookupUser(activeId).then((res) => {
          if (res?.success && res?.user?.email) {
            if (isTeacher) {
              setTeacherRegEmail(res.user.email);
            } else {
              setStudentRegEmail(res.user.email);
            }
          }
        }).catch((err) => {
          console.warn('[ProfileModal] Lookup email error:', err);
        });
      }
    }
  }, [isProfileSheetOpen, isTeacher, teacherFacultyId, studentEnrollment, teacherRegEmail, studentRegEmail]);

  const displayEmail = isTeacher
    ? (teacherRegEmail || (teacherFacultyId ? `${teacherFacultyId.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in` : 'N/A'))
    : (studentRegEmail || (studentEnrollment ? `${studentEnrollment.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in` : 'N/A'));

  const handleSignOutPress = () => {
    if (currentRole === 'STUDENT') {
      Alert.alert(
        'Student Sign Out',
        'Notice: Yeh device aaj aapke student account ke sath registered hai. Agar aap logout karenge, tab bhi midnight (raat 12 baje) tak koi doosra student is device par login nahi kar sakega.\n\nKya aap logout karna chahte hain?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ],
        { cancelable: true }
      );
    } else {
      signOut();
    }
  };

  return (
    <Modal visible={isProfileSheetOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.headerBanner, { backgroundColor: brandColor }]}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={36} color={brandColor} />
            </View>
            <Text style={styles.nameText}>
              {isTeacher ? (teacherRegName || 'Faculty Member') : (studentRegName || 'Student')}
            </Text>
            <Text style={styles.roleSubtext}>
              {isTeacher ? 'FACULTY MEMBER' : 'STUDENT ENROLLMENT'}
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.infoRow}>
              <MaterialIcons name="badge" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>ID / Enrollment:</Text>
              <Text style={styles.infoValue}>
                {isTeacher ? (teacherFacultyId || 'N/A') : (studentEnrollment || 'N/A')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="apartment" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>
                {isTeacher ? (teacherDepartment || 'CSIT') : (studentDepartment || 'CSIT')}
              </Text>
            </View>

            {!isTeacher && (
              <View style={styles.infoRow}>
                <MaterialIcons name="school" size={18} color={Colors.slate500} />
                <Text style={styles.infoLabel}>Program:</Text>
                <Text style={styles.infoValue}>
                  {studentCourseLevel && !['UG', 'PG', ''].includes(studentCourseLevel.trim())
                    ? studentCourseLevel
                    : (studentCourseLevel && /BCA|COMPUTER\s*APPLICATION/i.test(studentCourseLevel)) ||
                      (studentEnrollment && studentEnrollment.includes('/251/')) ||
                      (Array.isArray(studentEnrolledCourses) &&
                        studentEnrolledCourses.some(
                          (c: any) =>
                            (c.code || c.courseCode || '').toUpperCase().startsWith('CA') ||
                            (c.code || c.courseCode || '').toUpperCase().startsWith('BCA')
                        ))
                    ? 'BCA (Bachelor of Computer Applications)'
                    : 'B.Sc. (Computer Science)'}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {displayEmail}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Campus:</Text>
              <Text style={styles.infoValue}>GGU Bilaspur</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOutPress}
                activeOpacity={0.8}
              >
                <MaterialIcons name="logout" size={18} color={Colors.white} />
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsProfileSheetOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerBanner: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  roleSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.slate500,
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.slate800,
    fontWeight: '700',
    flex: 1,
  },
  actionRow: {
    marginTop: 10,
    gap: 10,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.liveRed,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.liveRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  closeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.slate100,
  },
  closeBtnText: {
    color: Colors.slate700,
    fontSize: 14,
    fontWeight: '600',
  },
});
