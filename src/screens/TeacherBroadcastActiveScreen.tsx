import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';

export const TeacherBroadcastActiveScreen: React.FC = () => {
  const {
    broadcastPin,
    broadcastSecondsLeft,
    currentAttendanceCount,
    totalAttendanceTarget,
    recentJoins,
    physicalHeadcount,
    incrementPhysicalHeadcount,
    decrementPhysicalHeadcount,
    isAuditModeActive,
    toggleAuditMode,
    navigateTo,
    stopBroadcastTimer,
    activeClassroom,
  } = useAttendance();

  const minutes = Math.floor(broadcastSecondsLeft / 60);
  const seconds = broadcastSecondsLeft % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.round((currentAttendanceCount / totalAttendanceTarget) * 100));

  const handleFinish = () => {
    stopBroadcastTimer();
    navigateTo('TEACHER_REPORT');
  };

  return (
    <View style={styles.container}>
      <CommonTopBar title="Live Broadcast" showBack onBack={handleFinish} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Bar */}
        <View style={styles.liveBar}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TRANSMITTING LIVE</Text>
          </View>
          <View style={styles.timerBox}>
            <MaterialIcons name="timer" size={16} color={Colors.slate600} />
            <Text style={styles.timerText}>{timerFormatted}</Text>
          </View>
        </View>

        {/* Big PIN Display */}
        <View style={styles.pinCard}>
          <Text style={styles.pinLabel}>STUDENT SESSION PIN</Text>
          <View style={styles.pinRow}>
            <View style={styles.pinBox}>
              <Text style={styles.pinDigit}>{broadcastPin[0] || '2'}</Text>
            </View>
            <View style={styles.pinBox}>
              <Text style={styles.pinDigit}>{broadcastPin[1] || '9'}</Text>
            </View>
          </View>
          <Text style={styles.pinHint}>
            Share with students inside {activeClassroom}
          </Text>
        </View>

        {/* Attendance Counter & Progress */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Verified Attendees</Text>
            <Text style={styles.statsCount}>
              {currentAttendanceCount} / {totalAttendanceTarget}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.statsPercent}>{progressPercent}% of class registered</Text>
        </View>

        {/* Headcount Audit Tool */}
        <View style={styles.auditCard}>
          <View style={styles.auditHeader}>
            <View>
              <Text style={styles.auditTitle}>Physical Headcount Audit</Text>
              <Text style={styles.auditSub}>Verify against classroom physical count</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.auditToggle,
                isAuditModeActive && { backgroundColor: Colors.teacherOrange },
              ]}
              onPress={toggleAuditMode}
            >
              <Text
                style={[
                  styles.auditToggleText,
                  isAuditModeActive && { color: Colors.white },
                ]}
              >
                {isAuditModeActive ? 'AUDIT ON' : 'AUDIT'}
              </Text>
            </TouchableOpacity>
          </View>

          {isAuditModeActive && (
            <View style={styles.auditControls}>
              <Text style={styles.counterLabel}>Physical count in room:</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={decrementPhysicalHeadcount}
                >
                  <MaterialIcons name="remove" size={20} color={Colors.slate700} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{physicalHeadcount}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={incrementPhysicalHeadcount}
                >
                  <MaterialIcons name="add" size={20} color={Colors.slate700} />
                </TouchableOpacity>
              </View>
              {currentAttendanceCount > physicalHeadcount && (
                <View style={styles.discrepancyAlert}>
                  <MaterialIcons name="warning" size={16} color={Colors.liveRed} />
                  <Text style={styles.discrepancyText}>
                    Discrepancy: {currentAttendanceCount - physicalHeadcount} more digital
                    check-ins than physical students!
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Live Join Feed */}
        <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>Recent Student Check-Ins</Text>
          {recentJoins.map((join, idx) => (
            <View key={idx} style={styles.feedItem}>
              <MaterialIcons name="check-circle" size={18} color={Colors.emeraldCheck} />
              <Text style={styles.feedText}>{join}</Text>
            </View>
          ))}
        </View>

        {/* Stop / End Session Action */}
        <TouchableOpacity
          style={styles.endSessionBtn}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <MaterialIcons name="stop-circle" size={22} color={Colors.white} />
          <Text style={styles.endSessionText}>COMPLETE & VIEW REPORT</Text>
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
    padding: 20,
    paddingBottom: 80,
    gap: 16,
  },
  liveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.liveRed,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.liveRed,
    letterSpacing: 1,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate700,
  },
  pinCard: {
    backgroundColor: Colors.teacherOrangeLight,
    borderWidth: 1.5,
    borderColor: Colors.teacherOrangeBorder,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.teacherOrangeDark,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pinBox: {
    width: 72,
    height: 84,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.teacherOrange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.teacherOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pinDigit: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.slate900,
  },
  pinHint: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 10,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  statsCount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.teacherOrangeDark,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.slate200,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.teacherOrange,
    borderRadius: 5,
  },
  statsPercent: {
    fontSize: 11,
    color: Colors.slate500,
    textAlign: 'right',
  },
  auditCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 12,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  auditSub: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  auditToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.slate200,
  },
  auditToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  auditControls: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.slate200,
    paddingTop: 12,
  },
  counterLabel: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '500',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.slate800,
    minWidth: 32,
    textAlign: 'center',
  },
  discrepancyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  discrepancyText: {
    fontSize: 12,
    color: Colors.liveRed,
    fontWeight: '600',
    flex: 1,
  },
  feedCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 10,
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  feedText: {
    fontSize: 12,
    color: Colors.slate700,
    fontWeight: '500',
  },
  endSessionBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.liveRed,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  endSessionText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
