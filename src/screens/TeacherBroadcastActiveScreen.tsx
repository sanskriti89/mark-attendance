import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { api } from '../services/api';

export const TeacherBroadcastActiveScreen: React.FC = () => {
  const {
    broadcastPin,
    broadcastSecondsLeft,
    currentAttendanceCount,
    setCurrentAttendanceCount,
    totalAttendanceTarget,
    recentJoins,
    setRecentJoins,
    physicalHeadcount,
    incrementPhysicalHeadcount,
    decrementPhysicalHeadcount,
    isAuditModeActive,
    toggleAuditMode,
    navigateTo,
    stopBroadcastTimer,
    activeClassroom,
    activeSessionId,
    setActiveSessionId,
    activeSubjectCode,
    activeSubjectName,
    teacherDepartment,
    teacherRegFacultyId,
    teacherRegName,
    setBroadcastPin,
    generateRandomPin,
  } = useAttendance();

  const pulseDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseDot, {
          toValue: 1.5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseDot, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Ensure active broadcast session is live on backend
  useEffect(() => {
    let isMounted = true;
    const ensureBroadcastActive = async () => {
      try {
        const check = await api.getActiveSession();
        if (isMounted && (!check || !check.hasActiveSession || !check.session)) {
          const pin =
            broadcastPin && broadcastPin.length >= 2
              ? broadcastPin
              : generateRandomPin
              ? generateRandomPin()
              : Math.floor(10 + Math.random() * 90).toString();
          const payload = {
            courseCode: activeSubjectCode || 'CIUCMJT2',
            courseName: activeSubjectName || 'Operating Systems',
            classroom: activeClassroom || 'CSIT Room FB',
            department: teacherDepartment || 'CSIT',
            broadcastPin: pin,
            durationSeconds: 900,
            totalTarget: 72,
            teacherFacultyId: teacherRegFacultyId || 'EMP/2026/8042',
            teacherName: teacherRegName || 'Dr. Rajesh Kumar Singh',
          };
          const startRes = await api.startBroadcast(payload);
          if (isMounted && startRes && startRes.success && startRes.session) {
            setActiveSessionId(startRes.session._id);
          }
        } else if (isMounted && check && check.session) {
          setActiveSessionId(check.session._id);
          if (check.session.broadcastPin && check.session.broadcastPin !== broadcastPin) {
            setBroadcastPin(check.session.broadcastPin);
          }
        }
      } catch (err) {
        console.warn('Auto ensure session error:', err);
      }
    };

    ensureBroadcastActive();

    // Poll for real-time verified student arrivals
    const pollLiveAttendees = async () => {
      try {
        const res = await api.getActiveSession();
        if (isMounted && res && res.success && res.session) {
          if (res.session._id) {
            setActiveSessionId(res.session._id);
          }
          if (typeof res.session.currentAttendanceCount === 'number') {
            setCurrentAttendanceCount(res.session.currentAttendanceCount);
          }
          if (Array.isArray(res.session.recentJoins) && res.session.recentJoins.length > 0) {
            setRecentJoins(res.session.recentJoins);
          }
          if (res.session.broadcastPin && res.session.broadcastPin !== broadcastPin) {
            setBroadcastPin(res.session.broadcastPin);
          }
        }
      } catch (e) {
        // network polling fallback
      }
    };

    pollLiveAttendees();
    const interval = setInterval(pollLiveAttendees, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const minutes = Math.floor(broadcastSecondsLeft / 60);
  const seconds = broadcastSecondsLeft % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.round((currentAttendanceCount / (totalAttendanceTarget || 72)) * 100));

  const handleFinish = async () => {
    stopBroadcastTimer();
    let targetSessionId = activeSessionId;
    try {
      const activeRes = await api.getActiveSession();
      if (activeRes && activeRes.success && activeRes.session && activeRes.session._id) {
        targetSessionId = activeRes.session._id;
        setActiveSessionId(targetSessionId);
      }
    } catch (e) {
      console.warn('Check active session before finish warning:', e);
    }

    if (targetSessionId) {
      try {
        await api.endSession(targetSessionId);
      } catch (e) {
        console.warn('End session error:', e);
      }
    }
    navigateTo('TEACHER_REPORT');
  };

  const handleBackToDashboard = () => {
    stopBroadcastTimer();
    navigateTo('TEACHER_DASHBOARD');
  };

  return (
    <View style={styles.container}>
      <CommonTopBar title="Live Broadcast" showBack onBack={handleBackToDashboard} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Bar */}
        <View style={styles.liveBar}>
          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseDot }] }]} />
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
              <Text style={styles.pinDigit}>{broadcastPin[0] || '-'}</Text>
            </View>
            <View style={styles.pinBox}>
              <Text style={styles.pinDigit}>{broadcastPin[1] || '-'}</Text>
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
          {recentJoins.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 18, gap: 4 }}>
              <MaterialIcons name="hourglass-empty" size={24} color={Colors.slate400} />
              <Text style={{ fontSize: 13, color: Colors.slate500 }}>Waiting for students to enter PIN...</Text>
            </View>
          ) : (
            recentJoins.map((join, idx) => (
              <View key={idx} style={styles.feedItem}>
                <MaterialIcons name="check-circle" size={18} color={Colors.emeraldCheck} />
                <Text style={styles.feedText}>{join}</Text>
              </View>
            ))
          )}
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
