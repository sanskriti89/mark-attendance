import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { NumericKeypad } from '../components/NumericKeypad';
import { SlideToConfirmButton } from '../components/SlideToConfirmButton';

export const StudentAttendanceScreen: React.FC = () => {
  const {
    studentEnteredPin,
    appendStudentPinDigit,
    backspaceStudentPin,
    clearStudentPin,
    submitStudentAttendance,
    resetStudentAttendance,
    studentAttendanceMarked,
    studentAttendanceMessage,
    campusGeofence,
    broadcastPin,
    activeSubjectCode,
    activeSubjectName,
    activeClassroom,
    navigateTo,
  } = useAttendance();

  const d1 = studentEnteredPin[0] || '-';
  const d2 = studentEnteredPin[1] || '-';

  return (
    <View style={styles.container}>
      <CommonTopBar title="Mark Attendance" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Campus Geofence Status Card */}
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceHeader}>
            <View style={styles.geofenceIcon}>
              <MaterialIcons name="my-location" size={20} color={Colors.emeraldCheck} />
            </View>
            <View style={styles.geofenceInfo}>
              <Text style={styles.geofenceTitle}>{campusGeofence.campusName}</Text>
              <Text style={styles.geofenceLocation}>{campusGeofence.locationName}</Text>
            </View>
          </View>
          <View style={styles.geofenceStatusRow}>
            <MaterialIcons name="verified" size={16} color={Colors.emeraldCheck} />
            <Text style={styles.geofenceStatusText}>
              Within 1.5km Campus Boundary ({campusGeofence.currentDistanceMeters}m from Dept)
            </Text>
          </View>
        </View>

        {/* Classroom Transmitter Card */}
        <View style={styles.beaconCard}>
          <View style={styles.beaconHeader}>
            <View style={styles.livePulseDot} />
            <Text style={styles.beaconTitle}>Active Class Transmitter Detected</Text>
          </View>
          <Text style={styles.beaconSub}>
            {activeSubjectCode}: {activeSubjectName} • {activeClassroom}
          </Text>
        </View>

        {/* Concentric Circle Target PIN Entry */}
        <View style={styles.targetWrapper}>
          <View style={styles.outerTargetRing}>
            <View style={styles.innerTargetRing}>
              <Text style={styles.pinTargetHeader}>ENTER 2-DIGIT PIN</Text>
              <Text style={styles.pinHint}>
                Announced verbally by your teacher (Hint: {broadcastPin})
              </Text>

              {/* Two Digit Underline Display */}
              <View style={styles.digitRow}>
                <View
                  style={[
                    styles.digitBox,
                    studentEnteredPin.length >= 1 && styles.digitBoxActive,
                  ]}
                >
                  <Text style={styles.digitChar}>{d1}</Text>
                </View>
                <View
                  style={[
                    styles.digitBox,
                    studentEnteredPin.length >= 2 && styles.digitBoxActive,
                  ]}
                >
                  <Text style={styles.digitChar}>{d2}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Feedback error or alert */}
          {studentAttendanceMessage && !studentAttendanceMarked && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={Colors.liveRed} />
              <Text style={styles.errorText}>{studentAttendanceMessage}</Text>
            </View>
          )}
        </View>

        {/* Keypad */}
        <NumericKeypad
          onDigitClick={appendStudentPinDigit}
          onBackspaceClick={backspaceStudentPin}
          onClearClick={clearStudentPin}
        />

        {/* Slide to Confirm Attendance */}
        <View style={styles.slideWrapper}>
          <SlideToConfirmButton
            title="SLIDE TO MARK ATTENDANCE"
            brandColor={Colors.studentTeal}
            isConfirmed={studentAttendanceMarked}
            onConfirmed={submitStudentAttendance}
          />
          <Text style={styles.slideNotice}>
            Ensure you are physically inside {activeClassroom} before confirming
          </Text>
        </View>
      </ScrollView>

      {/* Success Dialog Modal */}
      <Modal visible={studentAttendanceMarked} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successDialog}>
            <View style={styles.successIconCircle}>
              <MaterialIcons name="check" size={38} color={Colors.white} />
            </View>

            <Text style={styles.dialogTitle}>Attendance Verified!</Text>
            <Text style={styles.dialogSub}>
              Your attendance for {activeSubjectCode}: {activeSubjectName} has been
              authenticated and logged.
            </Text>

            <View style={styles.dialogDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Authentication:</Text>
                <Text style={styles.detailVal}>GGU GPS + Ultrasonic PIN</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailVal}>{activeClassroom}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailVal, { color: Colors.emeraldCheck }]}>
                  Recorded Present
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                resetStudentAttendance();
                navigateTo('STUDENT_DASHBOARD');
              }}
            >
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    padding: 20,
    paddingBottom: 80,
    gap: 16,
  },
  geofenceCard: {
    backgroundColor: Colors.successGreenLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  geofenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geofenceInfo: {
    flex: 1,
  },
  geofenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.successGreen,
  },
  geofenceLocation: {
    fontSize: 11,
    color: Colors.slate600,
    marginTop: 2,
  },
  geofenceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
    paddingTop: 8,
  },
  geofenceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.successGreen,
  },
  beaconCard: {
    backgroundColor: Colors.studentTealLight,
    borderWidth: 1,
    borderColor: Colors.studentTealSoft,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  beaconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.studentTeal,
  },
  beaconTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.studentTealDark,
  },
  beaconSub: {
    fontSize: 12,
    color: Colors.slate600,
    marginLeft: 16,
  },
  targetWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  outerTargetRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#CBEAF4',
    backgroundColor: 'rgba(237, 248, 251, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  innerTargetRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#EDF8FB',
    borderWidth: 2,
    borderColor: 'rgba(15, 135, 172, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pinTargetHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.studentTeal,
  },
  pinHint: {
    fontSize: 9,
    color: Colors.slate400,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  digitRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  digitBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 3,
    borderBottomColor: Colors.slate300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxActive: {
    borderBottomColor: Colors.studentTeal,
    backgroundColor: Colors.white,
  },
  digitChar: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.slate800,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.liveRed,
  },
  slideWrapper: {
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  slideNotice: {
    fontSize: 11,
    color: Colors.slate400,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.emeraldCheck,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
  },
  dialogSub: {
    fontSize: 12,
    color: Colors.slate600,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogDetailsBox: {
    width: '100%',
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.slate500,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate800,
  },
  doneBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.studentTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
