import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface SlideToConfirmButtonProps {
  title: string;
  brandColor?: string;
  onConfirmed: () => void;
  isConfirmed?: boolean;
  enabled?: boolean;
}

export const SlideToConfirmButton: React.FC<SlideToConfirmButtonProps> = ({
  title,
  brandColor = Colors.studentTeal,
  onConfirmed,
  isConfirmed = false,
  enabled = true,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [confirmed, setConfirmed] = useState(isConfirmed);
  const panX = useRef(new Animated.Value(0)).current;

  const thumbSize = 46;

  useEffect(() => {
    if (!isConfirmed && confirmed) {
      setConfirmed(false);
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [isConfirmed]);

  const maxDrag = Math.max(0, containerWidth - thumbSize - 6);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled && !confirmed && !isConfirmed,
      onMoveShouldSetPanResponder: () => enabled && !confirmed && !isConfirmed,
      onPanResponderMove: (_, gestureState) => {
        if (enabled && !confirmed && !isConfirmed && maxDrag > 0) {
          const clamped = Math.max(0, Math.min(maxDrag, gestureState.dx));
          panX.setValue(clamped);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!enabled || confirmed || isConfirmed || maxDrag <= 0) return;

        if (gestureState.dx >= maxDrag * 0.7) {
          // Confirm
          Animated.spring(panX, {
            toValue: maxDrag,
            useNativeDriver: false,
          }).start(() => {
            setConfirmed(true);
            onConfirmed();
          });
        } else {
          // Reset
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 12,
          }).start();
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const isComplete = confirmed || isConfirmed;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Background Track Fill */}
      <Animated.View
        style={[
          styles.trackFill,
          {
            width: Animated.add(panX, new Animated.Value(thumbSize)),
            backgroundColor: brandColor + '30',
          },
        ]}
      />

      {/* Label in Center */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.titleText,
            { color: isComplete ? Colors.emeraldCheck : Colors.slate600 },
          ]}
        >
          {isComplete ? 'CONFIRMED ✓' : title}
        </Text>
        {!isComplete && (
          <Text style={[styles.arrowHint, { color: brandColor }]}> »»</Text>
        )}
      </View>

      {/* Draggable Circle Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: panX }],
            backgroundColor: isComplete ? Colors.emeraldCheck : brandColor,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <MaterialIcons
          name={isComplete ? 'check' : 'arrow-forward'}
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
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 26,
  },
  textContainer: {
    ...StyleSheet.absoluteFill,
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
    left: 3,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
