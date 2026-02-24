import bcrypt from "bcryptjs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

// Function to hash the password with a salt
const hashPassword = async (password) => {
    try {
        // Generate a salt with a complexity factor (cost factor)
        const salt = await bcrypt.genSalt(10); // 10 is the cost factor, the higher the value, the more secure but slower it is

        // Hash the password with the generated salt
        const hashedPassword = await bcrypt.hash(password, salt);

        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password: ", error);
        throw new Error("Password hashing failed");
    }
};

// Save encrypted token
const saveAccessToken = async (token) => {
    try {
        await AsyncStorage.setItem("access_token", token);
        console.log("Access token saved");
    } catch (error) {
        console.error("Error saving access token:", error);
    }
};

// Retrieve and decrypt token
const getAccessToken = async () => {
    try {
        const token = await AsyncStorage.getItem("access_token");
        return token; // return token directly, no decryption
    } catch (error) {
        console.error("Error retrieving access token:", error);
        return null;
    }
};

const removeAccessToken = async () => {
    try {
        return AsyncStorage.removeItem("access_token");
    } catch (error) {
        console.error("Error removing token:", error);
    }
};

export { hashPassword, saveAccessToken, getAccessToken, removeAccessToken };
