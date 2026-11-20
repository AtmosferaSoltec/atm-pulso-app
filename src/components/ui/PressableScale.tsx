import type { ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 } as const;

/**
 * A pressable surface that sinks a little under the finger (spring on the UI thread). With reduced motion it
 * only dims. `style` styles the moving surface.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}) {
  const reduce = useReducedMotion();
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    opacity: reduce ? 1 - pressed.get() * 0.25 : 1,
    transform: [{ scale: reduce ? 1 : 1 - pressed.get() * (1 - scaleTo) }],
  }));
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withSpring(0, SPRING));
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
