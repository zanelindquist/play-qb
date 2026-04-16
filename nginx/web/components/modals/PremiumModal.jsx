import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar, Icon, TextInput } from 'react-native-paper';

import { useAlert } from '../../utils/alerts';
import { postProtectedRoute } from '../../utils/requests';

import theme from '../../assets/themes/theme';
import ustyles from '../../assets/styles/ustyles';
import GlassyButton from '../custom/GlassyButton';
import GlassyView from '../custom/GlassyView';
import Friend from '../entities/Friend';
import AddFriend from './AddFriendModal';


export default function PremiumModal({message, description, close}) {

    const [isInputCode, setIsInuptCode] = useState(false)
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [hasPremium, setHasPremium] = useState(true)

    function getPremium(){
        setError("")
        postProtectedRoute("/get_premium", {"code": code})
        .then((data) => {
            setHasPremium(data.data.message)
        })
        .catch((error) => {
            if(error.response?.data?.error) setError(error.response?.data?.error)
        })
    }

    if(hasPremium) return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <HelperText style={[ustyles.text.shadowText, ustyles.text.center, ustyles.text.header]}>You now have premium!</HelperText>
        </GlassyView>
    )

    if (isInputCode) return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <View style={ustyles.flex.flexRowSpaceBetween}>
                <IconButton size={20} icon={""} style={ustyles.icon.plain}/>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.header]}>Input Premium Code</HelperText>
                <IconButton size={20} icon={"close"} style={ustyles.icon.plain} onPress={close}/>
            </View>
            <View style={ustyles.flex.flexColumnCenterItems}>
                <TextInput
                    onChangeText={setCode}
                    style={ustyles.components.textInputLight}
                />
                <HelperText style={ustyles.text.error}>{error}</HelperText>
                <Button mode="contained" onPress={getPremium}>Redeem</Button>
            </View>
        </GlassyView>
    )

    return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <View style={ustyles.flex.flexRowSpaceBetweenNoAlign}>
                <View style={ustyles.flex.flexColumn}>
                    <HelperText style={[ustyles.text.shadowText, ustyles.text.header]}>{message}</HelperText>
                    <HelperText style={[ustyles.text.shadowText, ustyles.text.text]}>{description}</HelperText>
                </View>
                <IconButton size={20} icon={"close"} style={ustyles.icon.plain} onPress={close}/>
            </View>
            <View style={ustyles.flex.flexRowSpaceBetween}>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.text]}>Try your first month free, and then 4.99/mo after that.</HelperText>
                <Button mode="contained" onPress={() => setIsInuptCode(true)}>Get Premium</Button>
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 30
    },
});