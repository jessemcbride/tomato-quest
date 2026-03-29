import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { TitleScreen } from './src/screens/TitleScreen';
import { GameScreen } from './src/screens/GameScreen';

type RootStackParamList = {
  Title: undefined;
  Game: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0d1117" />
      <Stack.Navigator
        initialRouteName="Title"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0d1117' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Title" component={TitleScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
