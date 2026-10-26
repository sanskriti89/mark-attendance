import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  LayoutChangeEvent,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { hapticFeedback } from '../utils/haptics';

interface SlideToConfirmButtonProps {
  title: string;
  brandColor?: string;
  onConfirmed: () => void;
  isConfirmed?: boolean;
  enabled?: boolean;
  onSlideActive?: (isActive: boolean) => void;
}

export const SlideToConfirmButton: React.FC<SlideToConfirmButtonProps> = ({
  title,
  brandColor = Colors.studentTeal,
  onConfirmed,
  isConfirmed = false,
  enabled = true,
  onSlideActive,
}) => {
  const thumbSize = 46;
  const initialWidth = Dimensions.get('window').width - 40;
  const [containerWidth, setContainerWidth] = useState(initialWidth);
  const containerWidthRef = useRef(initialWidth);
  const maxDragRef = useRef(Math.max(0, initialWidth - thumbSize - 8));

  const panX = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  const hasTriggeredThresholdRef = useRef(false);

  // Keep fresh references to props/state to avoid stale closure freeze in PanResponder
  const stateRef = useRef({
    enabled,
    isConfirmed,
    onConfirmed,
    onSlideActive,
  });

  stateRef.current = {
    enabled,
    isConfirmed,
    onConfirmed,
    onSlideActive,
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidthRef.current) > 1) {
      containerWidthRef.current = width;
      maxDragRef.current = Math.max(0, width - thumbSize - 8);
      setContainerWidth(width);
    }
  };

  // Sync pan position when isConfirmed changes externally
  useEffect(() => {
    if (isConfirmed) {
      Animated.timing(panX, {
        toValue: maxDragRef.current,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(panX, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [isConfirmed]);

  const triggerConfirmation = () => {
    const { onConfirmed: onConf } = stateRef.current;
    hapticFeedback.success();
    onConf();

    // Safety check: if attendance was not completed (e.g. invalid PIN or GPS error), spring back
    setTimeout(() => {
      if (mountedRef.current && !stateRef.current.isConfirmed) {
        Animated.spring(panX, {
          toValue: 0,
          friction: 6,
          tension: 35,
          useNativeDriver: false,
        }).start();
      }
    }, 450);
  };

  const handleTapOrPressConfirm = () => {
    if (!stateRef.current.enabled || stateRef.current.isConfirmed) return;
    const maxDrag = maxDragRef.current;
    if (maxDrag <= 0) return;

    hapticFeedback.medium();
    Animated.timing(panX, {
      toValue: maxDrag,
      duration: 260,
      useNativeDriver: false,
    }).start(() => {
      triggerConfirmation();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        return isEn && !isConf;
      },
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        return isEn && !isConf && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.vx) > 0.1);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        // On Android native inside ScrollView: claim horizontal swipe immediately
        return (
          isEn &&
          !isConf &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 3
        );
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (!stateRef.current.enabled || stateRef.current.isConfirmed) return;
        panX.stopAnimation();
        hasTriggeredThresholdRef.current = false;
        hapticFeedback.light();
        stateRef.current.onSlideActive?.(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        if (!isEn || isConf) return;

        const maxDrag = maxDragRef.current;
        if (maxDrag <= 0) return;

        const clamped = Math.max(0, Math.min(maxDrag, gestureState.dx));
        panX.setValue(clamped);

        // Haptic feedback milestone when reaching 60% threshold
        if (clamped >= maxDrag * 0.6 && !hasTriggeredThresholdRef.current) {
          hasTriggeredThresholdRef.current = true;
          hapticFeedback.medium();
        } else if (clamped < maxDrag * 0.6 && hasTriggeredThresholdRef.current) {
          hasTriggeredThresholdRef.current = false;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        stateRef.current.onSlideActive?.(false);
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        if (!isEn || isConf) return;

        const maxDrag = maxDragRef.current;
        if (maxDrag <= 0) return;

        // Slide confirmed if dragged past 55% or with a quick flick
        const passedThreshold = gestureState.dx >= maxDrag * 0.55;
        const isFlick = gestureState.dx > 30 && gestureState.vx > 0.35;

        if (passedThreshold || isFlick) {
          Animated.spring(panX, {
            toValue: maxDrag,
            friction: 8,
            tension: 50,
            useNativeDriver: false,
          }).start(() => {
            triggerConfirmation();
          });
        } else {
          // Release early -> spring back to start
          hapticFeedback.light();
          Animated.spring(panX, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        stateRef.current.onSlideActive?.(false);
        if (mountedRef.current && !stateRef.current.isConfirmed) {
          Animated.spring(panX, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const maxDrag = maxDragRef.current > 0 ? maxDragRef.current : Math.max(1, containerWidth - thumbSize - 8);

  // Background track fill width
  const trackFillWidth = panX.interpolate({
    inputRange: [0, maxDrag],
    outputRange: [thumbSize, containerWidth],
    extrapolate: 'clamp',
  });

  // Label fades out smoothly as thumb moves across
  const textOpacity = panX.interpolate({
    inputRange: [0, maxDrag * 0.55],
    outputRange: [1, 0.1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.container,
        !enabled && styles.containerDisabled,
        Platform.OS === 'web' && ({ userSelect: 'none', touchAction: 'none' } as any),
      ]}
      onLayout={handleLayout}
    >
      {/* Background Track Fill */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.trackFill,
          {
            width: trackFillWidth,
            backgroundColor: isConfirmed ? Colors.emeraldCheck + '30' : brandColor + '25',
          },
        ]}
      />

      {/* Label in Center */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.textContainer,
          { opacity: isConfirmed ? 1 : textOpacity },
        ]}
      >
        <Text
          style={[
            styles.titleText,
            { color: isConfirmed ? Colors.emeraldCheck : Colors.slate600 },
          ]}
        >
          {isConfirmed ? 'CONFIRMED ✓' : title}
        </Text>
        {!isConfirmed && (
          <Text style={[styles.arrowHint, { color: brandColor }]}> »»</Text>
        )}
      </Animated.View>

      {/* Tap fallback area across the entire track for accessibility */}
      <TouchableOpacity
        style={styles.tapFallbackArea}
        onPress={handleTapOrPressConfirm}
        activeOpacity={0.9}
        disabled={!enabled || isConfirmed}
      />

      {/* Draggable Circle Thumb */}
      <Animated.View
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 30 }}
        style={[
          styles.thumb,
          {
            transform: [{ translateX: panX }],
            backgroundColor: isConfirmed ? Colors.emeraldCheck : brandColor,
          },
          Platform.OS === 'web' && ({ cursor: isConfirmed ? 'default' : 'grab' } as any),
        ]}
        {...panResponder.panHandlers}
      >
        <MaterialIcons
          name={isConfirmed ? 'check' : 'arrow-forward'}
          size={22}
          color={Colors.white}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.slate100,
    borderWidth: 1.5,
    borderColor: Colors.slate200,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  tapFallbackArea: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'transparent',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 26,
  },
  textContainer: {
    ...(StyleSheet.absoluteFill as any),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 20,
  },
  titleText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arrowHint: {
    fontSize: 14,
    fontWeight: '900',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});
