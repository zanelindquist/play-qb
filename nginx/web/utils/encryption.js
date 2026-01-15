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

const secretKey = "abcdefghijklmnopqrstuvwxyz1234567890";

// Save encrypted token
const saveAccessToken = async (token) => {
    try {
        const encryptedToken = CryptoJS.AES.encrypt(
            token,
            secretKey
        ).toString();
        await AsyncStorage.setItem("access_token", encryptedToken);

        console.log("Access token saved");
    } catch (error) {
        console.error("Error saving token:", error);
    }
};

// Retrieve and decrypt token
const getAccessToken = async () => {
    try {
        const encryptedToken = await AsyncStorage.getItem("access_token");
        if (encryptedToken) {
            const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
            const token = bytes.toString(CryptoJS.enc.Utf8);
            return token;
        }
        return null;
    } catch (error) {
        console.error("Error retrieving token:", error);
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
