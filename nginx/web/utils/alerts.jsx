/*
The original version of this file can be found in the Shifty project.
In this project, we need to call modals from the modals, which
has to be enabled thorough receiving JSX components instead of callable
functions (illegal with hooks in react) 
*/

import React, { createContext, useContext, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Portal, Modal, HelperText, Button } from "react-native-paper";
import theme from "../assets/themes/theme";

const AlertContext = createContext();

const useAlert = () => {
    return useContext(AlertContext);
};

const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({ visible: false, message: "" });
    const [modalStyle, setModalStyle] = useState(null);

    const showAlert = (content, style = null) => {
        setAlert({ visible: true, content });
        setModalStyle(style);
    };

    const hideAlert = () => {
        setAlert({ visible: false, message: "" });
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert.visible && (
                <CustomAlert
                    content={alert.content}
                    onClose={hideAlert}
                    modalStyle={modalStyle}
                />
            )}
        </AlertContext.Provider>
    );
};

const CustomAlert = ({ content, onClose, modalStyle }) => {
    return (
        <Portal style={styles.portal}>
            <Modal
                visible

            >
                <Pressable
                    onPress={onClose}
                    style={[
                        styles.modal,
                    ]}
                >
                    <View style={[styles.container, modalStyle]}>
                        {typeof content === "string" ? (
                            <>
                                <HelperText style={styles.title}>{content}</HelperText>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        mode="contained"
                                        onPress={onClose}
                                        style={styles.closeButton}
                                    >
                                        Close
                                    </Button>
                                </View>
                            </>
                        ) : (
                            // 🔑 Inject close safely
                            React.cloneElement(content, { close: onClose })
                        )}
                    </View>
                </Pressable>
            </Modal>
        </Portal>
    );
};

export { CustomAlert, useAlert, AlertProvider };

const styles = StyleSheet.create({
    portal: {

        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.9)"
    },
    modal: {
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    container: {
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 10,
        margin: "auto",
        width: "80%",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "center",
    },
    closeButton: {
        maxWidth: 300,
    },
});
