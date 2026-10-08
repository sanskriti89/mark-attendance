import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';

export const RoleSelectionScreen: React.FC = () => {
  const { selectRole } = useAttendance();

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 30) {
          selectRole('TEACHER');
        } else if (gesture.dy < -30) {
          selectRole('STUDENT');
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Top Half: Teacher */}
      <TouchableOpacity
        style={[styles.halfScreen, { backgroundColor: Colors.teacherSplit }]}
        onPress={() => selectRole('TEACHER')}
        activeOpacity={0.9}
      >
        <View style={styles.contentColumn}>
          <Text style={styles.roleTitle}>TEACHER</Text>
          <View style={styles.actionPromptRow}>
            <Text style={styles.promptText}>SWIPE DOWN OR TAP</Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Half: Student */}
      <TouchableOpacity
        style={[styles.halfScreen, { backgroundColor: Colors.studentSplit }]}
        onPress={() => selectRole('STUDENT')}
        activeOpacity={0.9}
      >
        <View style={styles.contentColumn}>
          <View style={styles.actionPromptRow}>
            <MaterialIcons
              name="keyboard-arrow-up"
              size={24}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.promptText}>SWIPE UP OR TAP</Text>
          </View>
          <Text style={styles.roleTitle}>STUDENT</Text>
        </View>
      </TouchableOpacity>

      {/* Floating Center Badge */}
      <View style={styles.floatingBadge}>
        <MaterialIcons name="unfold-more" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.badgeText}>SELECT ROLE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  roleTitle: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
  },
  actionPromptRow: {
    alignItems: 'center',
    gap: 4,
  },
  promptText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  floatingBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -18 }],
    backgroundColor: Colors.darkNavy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
