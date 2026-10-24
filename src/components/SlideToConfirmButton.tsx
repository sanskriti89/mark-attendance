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
  const thumbSize = 46;
  const initialWidth = Dimensions.get('window').width - 40;
  const [containerWidth, setContainerWidth] = useState(initialWidth);
  const containerWidthRef = useRef(initialWidth);
  const maxDragRef = useRef(Math.max(0, initialWidth - thumbSize - 6));

  const panX = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  // Keep fresh references to props/state to avoid stale closure freeze in PanResponder
  const stateRef = useRef({
    enabled,
    isConfirmed,
    onConfirmed,
  });

  stateRef.current = {
    enabled,
    isConfirmed,
    onConfirmed,
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
      maxDragRef.current = Math.max(0, width - thumbSize - 6);
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        return isEn && !isConf;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { enabled: isEn, isConf } = {
          enabled: stateRef.current.enabled,
          isConf: stateRef.current.isConfirmed,
        };
        return isEn && !isConf && Math.abs(gestureState.dx) > 3;
      },
      // Prevent parent ScrollView from canceling the horizontal drag gesture
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (!stateRef.current.enabled || stateRef.current.isConfirmed) return;
        panX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const { enabled: isEn, isConfirmed: isConf } = stateRef.current;
        if (!isEn || isConf) return;

        const maxDrag = maxDragRef.current;
        if (maxDrag <= 0) return;

        const clamped = Math.max(0, Math.min(maxDrag, gestureState.dx));
        panX.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { enabled: isEn, isConfirmed: isConf, onConfirmed: onConf } = stateRef.current;
        if (!isEn || isConf) return;

        const maxDrag = maxDragRef.current;
        if (maxDrag <= 0) return;

        // Slide confirmed if dragged past 65% or with a quick rightward flick
        const passedThreshold = gestureState.dx >= maxDrag * 0.65;
        const isFlick = gestureState.dx > 40 && gestureState.vx > 0.4;

        if (passedThreshold || isFlick) {
          Animated.spring(panX, {
            toValue: maxDrag,
            friction: 8,
            tension: 50,
            useNativeDriver: false,
          }).start(() => {
            onConf();

            // Safety check: if attendance was not completed (e.g., missing PIN), smoothly spring back
            setTimeout(() => {
              if (mountedRef.current && !stateRef.current.isConfirmed) {
                Animated.spring(panX, {
                  toValue: 0,
                  friction: 6,
                  tension: 35,
                  useNativeDriver: false,
                }).start();
              }
            }, 350);
          });
        } else {
          // Release early -> spring back to start
          Animated.spring(panX, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
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

  const maxDrag = maxDragRef.current > 0 ? maxDragRef.current : Math.max(1, containerWidth - thumbSize - 6);

  // Background track fill width
  const trackFillWidth = panX.interpolate({
    inputRange: [0, maxDrag],
    outputRange: [thumbSize, containerWidth],
    extrapolate: 'clamp',
  });

  // Label fades out smoothly as thumb moves across
  const textOpacity = panX.interpolate({
    inputRange: [0, maxDrag * 0.55],
    outputRange: [1, 0.12],
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
      {...panResponder.panHandlers}
    >
      {/* Background Track Fill */}
      <Animated.View
        style={[
          styles.trackFill,
          {
            width: trackFillWidth,
            backgroundColor: isConfirmed ? Colors.emeraldCheck + '25' : brandColor + '25',
          },
        ]}
      />

      {/* Label in Center */}
      <Animated.View
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

      {/* Draggable Circle Thumb */}
      <Animated.View
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 30 }}
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
