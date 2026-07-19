import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { RoleSelectScreen } from '../screens/onboarding/RoleSelectScreen';
import { AuthScreen } from '../screens/onboarding/AuthScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/** Pré-login: boas-vindas → papel → OTP. Depois do OTP, o RootNavigator troca. */
export function OnboardingNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
