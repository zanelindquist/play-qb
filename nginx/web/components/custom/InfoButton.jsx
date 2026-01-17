import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HelperText } from 'react-native-paper';
import theme from '../../assets/themes/theme';

const InfoButton = ({ description, size=25, filledIn, style, key }) => {
    const [visible, setVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const toggleDescription = () => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setVisible(false));
        } else {
            setVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    return (
        <View style={[styles.container, style]} key={key}>
            <TouchableOpacity onPress={toggleDescription} style={styles.button}>
                <Feather name="info" size={size} color={theme.onPrimary} />
            </TouchableOpacity>
            {visible && (
                <Animated.View style={[styles.descriptionBox, { opacity: fadeAnim }]}> 
                    <HelperText style={styles.descriptionText}>{description}</HelperText>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        zIndex: 1,
        elevation: 1
    },
    button: {
        padding: 5,
        // backgroundColor: theme.primary,

    },
    descriptionBox: {
        position: 'absolute',
        zIndex: 999,
        elevation: 5,
        top: "100%",
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        width: 200,
    },
    descriptionText: {
        fontSize: 14,
        color: '#333',
    },
});

export default InfoButton;