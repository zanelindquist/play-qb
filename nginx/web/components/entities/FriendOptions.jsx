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
import AddFriendModal from "../modals/AddFriendModal";

export default function FriendOptions({
    friends,
    friendRequests,
    socket,
    addEventListener,
    removeEventListener,
    style,
}) {
    const {showAlert} = useAlert()

    let fs = friends.sort((f) => (f.is_online ? -1 : 1));
    
    function handleInvite(hash) {
        socket.emit("invite_friend", {hash})
    } 

    function handleAddFriend(hash) {
        socket.emit("add_friend", {hash})
    }

    function handleUnfriend(hash) {
        socket.emit("remove_friend", {hash})
    }

    const openAddFriendModal = React.useCallback(() => {
        showAlert(
            <AddFriendModal
                socket={socket}
                addEventListener={addEventListener}
                removeEventListener={removeEventListener}
            />,
            styles.dialogueModalStyle
        );
    })

    return (
        <GlassyView style={[styles.container, style]}>
            <View>
                <View style={styles.friendsTitleContainer}>
                    <HelperText style={styles.label}>
                        Friends ({friends.length})
                    </HelperText>
                    <IconButton
                        icon={"account-plus"}
                        onPress={openAddFriendModal}
                        style={styles.iconButton}
                    />
                </View>

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
    friendsTitleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    iconButton: {
    
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
    },
});
