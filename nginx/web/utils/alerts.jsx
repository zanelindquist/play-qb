/*
The original version of this file can be found in the Shifty project.
In this project, we need to call modals from the modals, which
has to be enabled thorough receiving JSX components instead of callable
functions (illegal with hooks in react) 
*/

import React, { createContext, useContext, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Portal, Modal, HelperText, Button, Dialog } from "react-native-paper";
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
        <Portal>
            <Dialog
                visible
                onDismiss={onClose}
                style={[styles.dialog, modalStyle]}
                theme={{
                    ...theme,
                    colors: {
                        ...theme.colors,
                        backdrop: "rgba(0, 0, 0, 0.6)", // darker
                    },
                }}
            >
                <Dialog.Content>
                    {typeof content === "string" ? (
                        <Text>{content}</Text>
                    ) : (
                        React.cloneElement(content, { close: onClose })
                    )}
                </Dialog.Content>

                {typeof content === "string" && (
                    <Dialog.Actions>
                        <Button onPress={onClose}>Close</Button>
                    </Dialog.Actions>
                )}
            </Dialog>
        </Portal>
    );
};

export { CustomAlert, useAlert, AlertProvider };

const styles = StyleSheet.create({
    portal: {

    },
    dialog: {
        backgroundColor: theme.surface,
        borderRadius: 10
    },
    modal: {
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    container: {
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 10,
        margin: "auto",
        width: "80%",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        zIndex: 20,
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
