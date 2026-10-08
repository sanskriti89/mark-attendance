import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { Screen } from '../data/types';

export const QuickScreenSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentScreen, navigateTo } = useAttendance();

  const screens: { id: Screen; label: string; icon: any }[] = [
    { id: 'ROLE_SELECTION', label: '1. Role Selection', icon: 'swap-horiz' },
    { id: 'AUTH', label: '2. Login / Register', icon: 'lock' },
    { id: 'DOC_VERIFICATION', label: '3. ID Verification', icon: 'verified-user' },
    { id: 'REGISTRATION_SUCCESS', label: '4. Reg Success', icon: 'check-circle' },
    { id: 'TEACHER_DASHBOARD', label: '5. Faculty Schedule Hub', icon: 'dashboard' },
    { id: 'STUDENT_DASHBOARD', label: '6. Student Academic Hub', icon: 'school' },
    { id: 'TEACHER_BROADCAST_SETUP', label: '7. Teacher Broadcast Setup', icon: 'settings-remote' },
    { id: 'TEACHER_BROADCAST_ACTIVE', label: '8. Teacher Live Broadcast', icon: 'sensors' },
    { id: 'STUDENT_ATTENDANCE', label: '9. Student Attendance (PIN/GPS)', icon: 'pin' },
    { id: 'TEACHER_REPORT', label: '10. Teacher Report & Audit', icon: 'analytics' },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="apps" size={16} color={Colors.white} />
        <Text style={styles.floatingButtonText}>Screens</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <MaterialIcons name="dashboard" size={20} color={Colors.darkNavy} />
                <Text style={styles.modalTitle}>Quick Screen Switcher</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list}>
              {screens.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.screenItem, isActive && styles.activeScreenItem]}
                    onPress={() => {
                      navigateTo(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={isActive ? Colors.teacherOrange : Colors.slate600}
                    />
                    <Text
                      style={[styles.screenItemText, isActive && styles.activeScreenItemText]}
                    >
                      {item.label}
                    </Text>
                    {isActive && (
                      <MaterialIcons name="check" size={18} color={Colors.teacherOrange} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: Colors.darkNavy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  floatingButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
  screenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: Colors.slate50,
  },
  activeScreenItem: {
    backgroundColor: Colors.teacherOrangeLight,
    borderWidth: 1,
    borderColor: Colors.teacherOrangeBorder,
  },
  screenItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate700,
    flex: 1,
  },
  activeScreenItemText: {
    color: Colors.teacherOrangeDark,
    fontWeight: '700',
  },
});
