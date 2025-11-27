import React, { createContext, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Modal, HelperText, Button } from 'react-native-paper';
import theme from '../assets/themes/theme';

const AlertContext = createContext();

const useAlert = () => {
    return useContext(AlertContext);
};

const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({ visible: false, message: '' });
    const [modalStyle, setModalStyle] = useState(null)

    const showAlert = (message, style=null) => {
        setAlert({ visible: true, message });
        setModalStyle(style)
    };

    const hideAlert = () => {
        setAlert({ visible: false, message: '' });
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
        {children}
        {alert.visible && (
            <CustomAlert message={alert.message} onClose={hideAlert} modalStyle={modalStyle}/>
        )}
        </AlertContext.Provider>
    );
};

const CustomAlert = ({ message, onClose, modalStyle }) => {
  return (
    <Portal style={styles.portal}>
      <Modal visible onDismiss={onClose} contentContainerStyle={[styles.modal, modalStyle, {backgroundColor: theme.surface}]}>
        {
            typeof message === 'string' ?
            <HelperText style={styles.title}>{message}</HelperText>
            :
            message({close: onClose})
        }
        {
            typeof message === 'string' ? (
                <View style={styles.buttonContainer}>
                    <Button mode='contained' onPress={onClose} style={styles.closeButton}>Close</Button>            
                </View>
            ) : ""
        }
      </Modal>
    </Portal>
  );
};

export { CustomAlert, useAlert, AlertProvider}

const styles = StyleSheet.create({
    portal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modal: {
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 10,
        margin: 'auto',
        width: "80%"
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    closeButton: {
        maxWidth: 300
    }
});