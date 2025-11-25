import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter, Router } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      onLayout={() => {router.push('/signin')}}
    >
      <Text>Home Screen</Text>
      <Button mode="contained" onPress={() => router.push('/signin')}>
        Sign in
      </Button>
    </View>
  );
}