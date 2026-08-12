import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

export default function PressableScale({ children, style, className, disabled, scale = 0.97, onPress, ...props }) {
  const value = useRef(new Animated.Value(1)).current;
  const animate = (toValue) => Animated.spring(value, { toValue, useNativeDriver: true, speed: 36, bounciness: 4 }).start();

  return (
    <Animated.View className={className} style={[style, { transform: [{ scale: value }] }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => !disabled && animate(scale)}
        onPressOut={() => !disabled && animate(1)}
        style={({ pressed }) => [{ opacity: disabled ? 0.55 : pressed ? 0.94 : 1 }]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
