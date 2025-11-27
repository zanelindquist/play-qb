import { Image, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";


export default function Logo({width, height, text=false}) {
  return (
    <View style={styles.container}>
        <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 75, height: 75 }}
            resizeMode="contain"
        />
        {
            text && <Text style={styles.text}>PlayQB</Text>
        }
    </View>

  );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    text: {
        fontSize: 30,
        fontWeight: 600
    }
})