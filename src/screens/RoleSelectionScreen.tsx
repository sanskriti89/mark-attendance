import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { Role } from '../data/types';

export const RoleSelectionScreen: React.FC = () => {
  const { selectRole } = useAttendance();
  const { height: windowHeight } = Dimensions.get('window');
  const [screenHeight, setScreenHeight] = useState(windowHeight || 800);

  const screenHeightRef = useRef(screenHeight);
  screenHeightRef.current = screenHeight;

  // Animated drag value: 0 = 50/50 split, > 0 expands Teacher (down), < 0 expands Student (up)
  const dragY = useRef(new Animated.Value(0)).current;
  const isTransitioning = useRef(false);

  // Subtle breathing pulse for action arrows
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dragY.setValue(0);
    isTransitioning.current = false;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const completeTransition = (role: Role) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const currentHalfHeight = screenHeightRef.current / 2;
    const targetValue = role === 'TEACHER' ? currentHalfHeight : -currentHalfHeight;

    Animated.timing(dragY, {
      toValue: targetValue,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      selectRole(role);
    });
  };

  const resetPosition = () => {
    Animated.spring(dragY, {
      toValue: 0,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > 6;
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (isTransitioning.current) return;
        dragY.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        if (isTransitioning.current) return;
        const currentHalfHeight = screenHeightRef.current / 2;
        const clampedDy = Math.max(-currentHalfHeight, Math.min(currentHalfHeight, gesture.dy));
        dragY.setValue(clampedDy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (isTransitioning.current) return;

        const currentHalfHeight = screenHeightRef.current / 2;
        const currentHeight = screenHeightRef.current;
        const threshold = currentHeight * 0.25; // 25% drag threshold

        // If touch had negligible drag movement, treat as tap fallback
        const isTap = Math.abs(gesture.dy) < 10 && Math.abs(gesture.dx) < 10;
        if (isTap) {
          if (gesture.y0 < currentHalfHeight) {
            completeTransition('TEACHER');
          } else {
            completeTransition('STUDENT');
          }
          return;
        }

        const isFastSwipeDown = gesture.dy > 30 && gesture.vy > 0.45;
        const isFastSwipeUp = gesture.dy < -30 && gesture.vy < -0.45;
        const isPastThresholdDown = gesture.dy > threshold;
        const isPastThresholdUp = gesture.dy < -threshold;

        if (isPastThresholdDown || isFastSwipeDown) {
          completeTransition('TEACHER');
        } else if (isPastThresholdUp || isFastSwipeUp) {
          completeTransition('STUDENT');
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        if (!isTransitioning.current) {
          resetPosition();
        }
      },
    })
  ).current;

  const halfHeight = screenHeight / 2;

  // Dynamic heights for the two halves
  const teacherHeight = dragY.interpolate({
    inputRange: [-halfHeight, 0, halfHeight],
    outputRange: [0, halfHeight, screenHeight],
    extrapolate: 'clamp',
  });

  const studentHeight = dragY.interpolate({
    inputRange: [-halfHeight, 0, halfHeight],
    outputRange: [screenHeight, halfHeight, 0],
    extrapolate: 'clamp',
  });

  // Content opacities to smoothly hide collapsing sections
  const teacherContentOpacity = dragY.interpolate({
    inputRange: [-halfHeight * 0.5, 0, halfHeight],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const studentContentOpacity = dragY.interpolate({
    inputRange: [-halfHeight, 0, halfHeight * 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  // Floating badge follows split seam and fades as drag expands
  const badgeOpacity = dragY.interpolate({
    inputRange: [-halfHeight * 0.35, 0, halfHeight * 0.35],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const badgeTranslateY = dragY.interpolate({
    inputRange: [-halfHeight, halfHeight],
    outputRange: [-halfHeight - 18, halfHeight - 18],
    extrapolate: 'clamp',
  });

  // Pulse translations for arrows
  const teacherArrowTranslateY = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const studentArrowTranslateY = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0 && Math.abs(height - screenHeight) > 1) {
          setScreenHeight(height);
        }
      }}
      {...panResponder.panHandlers}
    >
      {/* Top Half: Teacher */}
      <Animated.View
        style={[
          styles.halfScreen,
          {
            backgroundColor: Colors.teacherSplit,
            height: teacherHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          onPress={() => completeTransition('TEACHER')}
          activeOpacity={0.92}
        >
          <Animated.View style={[styles.contentColumn, { opacity: teacherContentOpacity }]}>
            <Text style={styles.roleTitle}>TEACHER</Text>
            <View style={styles.actionPromptRow}>
              <Text style={styles.promptText}>SWIPE DOWN OR TAP</Text>
              <Animated.View style={{ transform: [{ translateY: teacherArrowTranslateY }] }}>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="rgba(255,255,255,0.9)"
                />
              </Animated.View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Half: Student */}
      <Animated.View
        style={[
          styles.halfScreen,
          {
            backgroundColor: Colors.studentSplit,
            height: studentHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          onPress={() => completeTransition('STUDENT')}
          activeOpacity={0.92}
        >
          <Animated.View style={[styles.contentColumn, { opacity: studentContentOpacity }]}>
            <View style={styles.actionPromptRow}>
              <Animated.View style={{ transform: [{ translateY: studentArrowTranslateY }] }}>
                <MaterialIcons
                  name="keyboard-arrow-up"
                  size={24}
                  color="rgba(255,255,255,0.9)"
                />
              </Animated.View>
              <Text style={styles.promptText}>SWIPE UP OR TAP</Text>
            </View>
            <Text style={styles.roleTitle}>STUDENT</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Floating Center Badge */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingBadge,
          {
            opacity: badgeOpacity,
            transform: [
              { translateX: -70 },
              { translateY: badgeTranslateY },
            ],
          },
        ]}
      >
        <MaterialIcons name="unfold-more" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.badgeText}>SELECT ROLE</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  halfScreen: {
    width: '100%',
    overflow: 'hidden',
  },
  touchArea: {
    flex: 1,
    width: '100%',
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
