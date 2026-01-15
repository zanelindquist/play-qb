// React native components
import {
    Platform,
    View,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import {
    Text,
    HelperText,
    Icon,
    IconButton,
    Divider,
} from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";
import Friend from "./Friend";
import User from "./User";

export default function FriendOptions({
    friends,
    friendRequests,
    handleInvite,
    handleAddFriend,
    handleUnfriend,
    style,
}) {
    let fs = friends.sort((f) => (f.is_online ? -1 : 1));

    return (
        <GlassyView style={[styles.container, style]}>
            <View>
                <HelperText style={styles.label}>
                    Friends ({friends.length})
                </HelperText>
                {friends && fs.length > 0 ? (
                    fs.map((f) => (
                        <Friend
                            onPress={() => handleInvite(f.hash)}
                            friend={f}
                            showIcon={false}
                            onUnfriend={() => handleUnfriend(f.hash)}
                            isMenu={true}
                        />
                    ))
                ) : (
                    <HelperText>No friends online right now</HelperText>
                )}
            </View>
            <View>
                <HelperText style={styles.label}>
                    Friend Requests ({friendRequests.length})
                </HelperText>
                {friendRequests.length > 0 ? (
                    friendRequests.map((u) => (
                        <User
                            user={u}
                            showIcon={false}
                            onPress={() => handleAddFriend(u.hash)}
                        />
                    ))
                ) : (
                    <HelperText>No friends requests</HelperText>
                )}
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        gap: 10,
        overflow: "visible"
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
    },
});
