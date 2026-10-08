import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';

export const DocumentVerificationScreen: React.FC = () => {
  const { currentRole, navigateTo } = useAttendance();
  const [docUploaded, setDocUploaded] = useState(true);
  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  return (
    <View style={styles.container}>
      <CommonTopBar title="ID Verification" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.badge, { color: brandColor }]}>STEP 2 OF 2</Text>
          <Text style={styles.title}>
            {isTeacher ? 'Faculty ID Verification' : 'Student Identity Card'}
          </Text>
          <Text style={styles.subtitle}>
            Upload or scan your official Guru Ghasidas Vishwavidyalaya institutional identity card.
          </Text>
        </View>

        {/* Upload Card Mock */}
        <View style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="credit-card" size={24} color={brandColor} />
            <Text style={styles.cardTitle}>GGU Institutional Smart Card</Text>
          </View>

          <View style={styles.previewBox}>
            <MaterialIcons name="check-circle" size={48} color={Colors.emeraldCheck} />
            <Text style={styles.previewTitle}>Document Verified</Text>
            <Text style={styles.previewSub}>
              {isTeacher
                ? 'FAC-CS-8924 • Dr. Eleanor Vance'
                : '2024-BTECH-CS-042 • Alex Morgan'}
            </Text>
            <Text style={styles.deptSub}>
              Dept of CSIT • School of Mathematical & Computational Sciences
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reuploadBtn}
            onPress={() =>
              Alert.alert('Scanner', 'Camera / OCR scan simulator is active.')
            }
          >
            <MaterialIcons name="camera-alt" size={18} color={brandColor} />
            <Text style={[styles.reuploadText, { color: brandColor }]}>
              Rescan / Change Document
            </Text>
          </TouchableOpacity>
        </View>

        {/* Institutional Verification checklist */}
        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <MaterialIcons name="verified" size={18} color={Colors.emeraldCheck} />
            <Text style={styles.checkText}>Active GGU Registrar Record Found</Text>
          </View>
          <View style={styles.checkItem}>
            <MaterialIcons name="verified" size={18} color={Colors.emeraldCheck} />
            <Text style={styles.checkText}>Department Roster Affiliation Confirmed</Text>
          </View>
          <View style={styles.checkItem}>
            <MaterialIcons name="verified" size={18} color={Colors.emeraldCheck} />
            <Text style={styles.checkText}>Campus Geofence Access Authorized</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: brandColor }]}
          onPress={() => navigateTo('REGISTRATION_SUCCESS')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Complete Verification</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
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
});
