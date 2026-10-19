import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { setAuthToken } from '../services/api';

export const ProfileModal: React.FC = () => {
  const {
    isProfileSheetOpen,
    setIsProfileSheetOpen,
    currentRole,
    studentRegName,
    studentEnrollment,
    studentRegEnrollment,
    studentDepartment,
    studentRegEmail,
    teacherRegName,
    teacherFacultyId,
    teacherDepartment,
    teacherRegEmail,
    switchRole,
    navigateTo,
    setStudentPassword,
    resetStudentAttendance,
    setUserNotification,
  } = useAttendance();

  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  const resolvedStudentName = studentRegName || 'Aarav Sharma';
  const resolvedStudentEnrollment = studentEnrollment || studentRegEnrollment || 'GGV/22/0892';

  // Accurately resolve student email: prioritize verified registration email, then backend/institution email format
  const studentDisplayEmail =
    studentRegEmail?.trim() ||
    (resolvedStudentName
      ? `${resolvedStudentName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@ggu.ac.in`
      : `${resolvedStudentEnrollment.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in`);

  const teacherDisplayEmail =
    teacherRegEmail?.trim() ||
    (teacherFacultyId === 'FAC-CS-8924'
      ? 'e.vance@ggu.ac.in'
      : teacherRegName
      ? `${teacherRegName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@ggu.ac.in`
      : 'faculty@ggu.ac.in');

  const handleLogout = () => {
    // Invalidate auth token in API client
    setAuthToken(null);
    // Clear password for security
    setStudentPassword('');
    // Reset any temporary attendance PIN/session state
    resetStudentAttendance();
    // Dismiss profile modal
    setIsProfileSheetOpen(false);
    // User feedback
    setUserNotification('Logged out successfully.');
    // Redirect back to initial portal role selection
    navigateTo('ROLE_SELECTION');
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
              {isTeacher ? teacherRegName : resolvedStudentName}
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
                {isTeacher ? teacherFacultyId : resolvedStudentEnrollment}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="apartment" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>
                {isTeacher ? teacherDepartment : studentDepartment}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {isTeacher ? teacherDisplayEmail : studentDisplayEmail}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Campus:</Text>
              <Text style={styles.infoValue}>GGU Bilaspur</Text>
            </View>

            <View style={styles.actionRow}>
              {isTeacher ? (
                <TouchableOpacity
                  style={[styles.switchBtn, { borderColor: brandColor }]}
                  onPress={() => {
                    switchRole();
                    setIsProfileSheetOpen(false);
                  }}
                >
                  <MaterialIcons name="swap-horiz" size={18} color={brandColor} />
                  <Text style={[styles.switchBtnText, { color: brandColor }]}>
                    Switch to Student
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={18} color={Colors.liveRed} />
                  <Text style={styles.logoutBtnText}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: brandColor }]}
                onPress={() => setIsProfileSheetOpen(false)}
              >
                <Text style={styles.closeBtnText}>Done</Text>
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
    gap: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.liveRed,
  },
  closeBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
