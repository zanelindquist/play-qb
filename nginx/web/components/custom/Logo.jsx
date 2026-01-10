import { Image, View, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";
import theme from "@/assets/themes/theme";
import { useRouter } from "expo-router";

export default function Logo({ width, height, text = false, image = true }) {
    const start = theme.primary;
    const end = theme.secondary;

    const router = useRouter()

    return (
        <Pressable
            style={styles.container}
            onPress={() => router.replace("/")}    
        >
            {/* <Svg width={128} height={128} viewBox="0 0 128 128">
                <Defs>
                    <LinearGradient
                        id="brandGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <Stop offset="0" stopColor={start} />
                        <Stop offset="1" stopColor={end} />
                    </LinearGradient>
                </Defs>

                <Rect
                    x="12"
                    y="12"
                    width="104"
                    height="104"
                    rx="28"
                    stroke="url(#brandGradient)"
                    strokeWidth={10}
                    fill="none"
                />

                <Path
                    d="M54 44 Q54 40 58 42 L86 60 Q90 64 86 68 L58 86 Q54 88 54 84 Z"
                    fill="url(#brandGradient)"
                />
            </Svg> */}
            
            {image &&
            <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 75, height: 75 }}
                resizeMode="contain"
            />}
            {text && <Text style={styles.text}>PlayQB</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    },
    text: {
        fontSize: 30,
        fontWeight: 600,
        textAlignVertical: "center"
    },
});
