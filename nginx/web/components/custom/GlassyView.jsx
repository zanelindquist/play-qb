import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function GlassyView({
  children,
  style,
  intensity = 60,
  tint = "light",
}) {
  const combined = [styles.glass, style];

  // native blur
  if (Platform.OS !== "web") {
    return (
      <BlurView intensity={intensity} tint={tint} style={combined}>
        {children}
      </BlurView>
    );
  }

  // web fallback
  return (
    <View style={[combined, styles.webFallback]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 20,
    overflow: "hidden",

    // 100% transparent — lets blur show real content behind it
    backgroundColor: "rgba(255,255,255,0.05)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",

    // FLOATING EFFECT
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10, // Android floating
    padding: 12,
  },

  webFallback: {
    backdropFilter: "blur(18px) saturate(180%)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
