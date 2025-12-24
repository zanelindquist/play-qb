import React, {useRef} from "react";
import { Platform, View, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function GlassyView({
  children,
  style,
  intensity = 60,
  tint = "light",
  gradient = null, // { colors: [...], start: {x,y}, end: {x,y} }
  onPress,
  hoverMode
}) {
  const combined = [styles.glass, style];
  let component = null;
  const width = useRef(new Animated.Value(0))

  function handleHoverIn() {

  }

  function handleHoverOut() {

  }

  // Native (iOS / Android)
  if (Platform.OS !== "web") {
    component =
      <>
        {gradient && (
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={StyleSheet.absoluteFill}
          />
        )}

        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill}>
          {children}
        </BlurView>
      </>
  } else {
    // Web fallback
    component = 
      <>
        {gradient && (
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        {children}
      </>
  }

  if(onPress) {
    return (
      <Pressable
        style={
          Platform.OS == "web" ?
          [combined, styles.webFallback] :
          combined
        }
        onPress={onPress}
      >
      {component}
      </Pressable>
    )
  }
  else {
    return (
      <View
        style={
          Platform.OS == "web" ?
          [combined, styles.webFallback] :
          combined
        }
      >
      {component}
      </View>
    )
  }

}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 20,
    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,

    padding: 12,
  },

  webFallback: {
    backdropFilter: "blur(18px) saturate(180%)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
