import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton, HelperText } from 'react-native-paper';
import theme from '../../assets/themes/theme';


const CustomDrawerItem = ({ label, icon, iconColor, onPress, inline }) => {
    
    return (
        <TouchableOpacity onPress={onPress} style={inline ? styles.drawerItemInline : styles.drawerItem}>
            <IconButton icon={icon} size={30} style={styles.iconStyle} iconColor={iconColor}/>
            {
                label &&
                (
                    inline ?
                    <View style={styles.drawerLabelInlineView}>
                        <HelperText style={[styles.drawerLabel, styles.drawerLabelInline]}>{label}</HelperText>
                    </View>
                    : 
                    <HelperText style={styles.drawerLabel}>{label}</HelperText>
                )
            }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    drawerItem: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10
    },
    drawerItemInline: {
        flexDirection: "row",
        margin: 10
    },
    drawerLabelInlineView: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    drawerLabel: {
        textAlign: "center",
        marginHorizontal: 5,
        padding: 0,
        fontWeight: "bold",
        fontSize: "0.8rem",
        color: theme.onBackground
    },
    drawerLabelInline: {
        fontSize: "1rem"
    },
    iconStyle: {
        margin: 0,
        padding: 0
    }
});

export default CustomDrawerItem;