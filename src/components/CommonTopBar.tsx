import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';

interface CommonTopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showRoleBadge?: boolean;
}

export const CommonTopBar: React.FC<CommonTopBarProps> = ({
  title,
  showBack = true,
  onBack,
  showRoleBadge = true,
}) => {
  const { currentRole, switchRole, goBack, setIsProfileSheetOpen } = useAttendance();
  const isTeacher = currentRole === 'TEACHER';
  const brandColor = isTeacher ? Colors.teacherOrange : Colors.studentTeal;

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || goBack}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.slate700} />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.titleText}>{title}</Text>}
      </View>

      <View style={styles.rightRow}>
        {showRoleBadge && (
          <TouchableOpacity
            style={[styles.roleBadge, { borderColor: brandColor }]}
            onPress={switchRole}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isTeacher ? 'school' : 'person'}
              size={14}
              color={brandColor}
            />
            <Text style={[styles.roleBadgeText, { color: brandColor }]}>
              {currentRole}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.avatarButton, { backgroundColor: brandColor }]}
          onPress={() => setIsProfileSheetOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="person" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate800,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Colors.slate50,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
