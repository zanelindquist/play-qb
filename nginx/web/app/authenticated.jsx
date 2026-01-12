import { useRouter } from 'expo-router';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { HelperText } from 'react-native-paper';
import Logo from "../components/custom/Logo"


export default function Authenticated() {


  return ( 
    <View style={styles.container}>
        <Logo text={true} image={true}/>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "black"
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "black",
    },
    text: {
        fontSize: 50,
        fontWeight: "bold"
    }
})