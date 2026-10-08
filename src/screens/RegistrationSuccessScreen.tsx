import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';

export const RegistrationSuccessScreen: React.FC = () => {
  const { currentRole, navigateTo } = useAttendance();
  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check" size={54} color={Colors.white} />
        </View>

        <Text style={styles.title}>Registration Complete!</Text>
        <Text style={styles.subtitle}>
          Your Guru Ghasidas Vishwavidyalaya institutional credentials have been verified and approved.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Assigned:</Text>
            <Text style={[styles.infoVal, { color: brandColor }]}>{currentRole}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoVal}>CSIT (Computer Science & IT)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Campus Geofence:</Text>
            <Text style={styles.infoVal}>GGU Koni Bilaspur (Active)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: brandColor }]}
          onPress={() =>
            navigateTo(isTeacher ? 'TEACHER_BROADCAST_SETUP' : 'STUDENT_ATTENDANCE')
          }
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            Go to {isTeacher ? 'Teacher Dashboard' : 'Student Portal'}
          </Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.emeraldCheck,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.slate900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoBox: {
    width: '100%',
    backgroundColor: Colors.slate50,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  btn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
