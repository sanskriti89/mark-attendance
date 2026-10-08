import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';

export const ProfileModal: React.FC = () => {
  const {
    isProfileSheetOpen,
    setIsProfileSheetOpen,
    currentRole,
    studentRegName,
    studentEnrollment,
    studentDepartment,
    studentRegEmail,
    teacherRegName,
    teacherFacultyId,
    teacherDepartment,
    teacherRegEmail,
    switchRole,
    navigateTo,
  } = useAttendance();

  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  return (
    <Modal visible={isProfileSheetOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.headerBanner, { backgroundColor: brandColor }]}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={36} color={brandColor} />
            </View>
            <Text style={styles.nameText}>
              {isTeacher ? teacherRegName : studentRegName}
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
                {isTeacher ? teacherFacultyId : studentEnrollment}
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
              <Text style={styles.infoValue}>
                {isTeacher ? teacherRegEmail : studentRegEmail}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={18} color={Colors.slate500} />
              <Text style={styles.infoLabel}>Campus:</Text>
              <Text style={styles.infoValue}>GGU Bilaspur</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.switchBtn, { borderColor: brandColor }]}
                onPress={() => {
                  switchRole();
                  setIsProfileSheetOpen(false);
                }}
              >
                <MaterialIcons name="swap-horiz" size={18} color={brandColor} />
                <Text style={[styles.switchBtnText, { color: brandColor }]}>
                  Switch to {isTeacher ? 'Student' : 'Teacher'}
                </Text>
              </TouchableOpacity>

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
