import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { NumericKeypad } from '../components/NumericKeypad';

export const TeacherBroadcastSetupScreen: React.FC = () => {
  const {
    broadcastPin,
    appendBroadcastPinDigit,
    backspaceBroadcastPin,
    clearBroadcastPin,
    navigateTo,
    activeSubjectCode,
    activeSubjectName,
    activeClassroom,
    teacherRegName,
  } = useAttendance();

  return (
    <View style={styles.container}>
      <CommonTopBar title="Session Setup" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Active Class Card */}
        <View style={styles.classCard}>
          <View style={styles.classCardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LIVE CLASS</Text>
            </View>
            <View style={styles.roomRow}>
              <MaterialIcons name="place" size={14} color={Colors.slate400} />
              <Text style={styles.roomText}>{activeClassroom}</Text>
            </View>
          </View>

          <Text style={styles.subjectTitle}>
            {activeSubjectCode}: {activeSubjectName}
          </Text>

          <View style={styles.classMetaRow}>
            <Text style={styles.profName}>{teacherRegName || 'Dr. Eleanor Vance'}</Text>
            <Text style={styles.timeText}>10:15 AM - 11:15 AM</Text>
          </View>
        </View>

        {/* Radar Concentric Rings PIN Display */}
        <View style={styles.radarContainer}>
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={styles.innerRing}>
                <Text style={styles.pinHeader}>BROADCAST PIN</Text>
                <Text style={styles.pinText}>
                  {broadcastPin.length === 0
                    ? '-  -'
                    : broadcastPin.length === 1
                    ? `${broadcastPin}  -`
                    : `${broadcastPin[0]}  ${broadcastPin[1]}`}
                </Text>
                <Text style={styles.pinSub}>Classroom Wireless Broadcast</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Numeric Keypad */}
        <NumericKeypad
          onDigitClick={appendBroadcastPinDigit}
          onBackspaceClick={backspaceBroadcastPin}
          onClearClick={clearBroadcastPin}
        />

        {/* Actions */}
        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={styles.broadcastButton}
            onPress={() => navigateTo('TEACHER_BROADCAST_ACTIVE')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="sensors" size={20} color={Colors.white} />
            <Text style={styles.broadcastButtonText}>COLLECT ATTENDANCE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigateTo('TEACHER_REPORT')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="analytics" size={18} color={Colors.slate600} />
            <Text style={styles.reportButtonText}>View Attendance Reports</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingBottom: 80,
    gap: 16,
  },
  classCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: Colors.teacherOrangeLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.teacherOrangeBorder,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.teacherOrangeDark,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  classMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  profName: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  outerRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: 'rgba(255, 247, 237, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    backgroundColor: 'rgba(255, 247, 237, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FB923C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.slate400,
  },
  pinText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: Colors.slate900,
    marginVertical: 2,
  },
  pinSub: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.slate400,
  },
  actionColumn: {
    gap: 10,
    marginTop: 6,
  },
  broadcastButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.teacherOrange,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  broadcastButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reportButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.slate100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reportButtonText: {
    color: Colors.slate700,
    fontSize: 13,
    fontWeight: '600',
  },
});
