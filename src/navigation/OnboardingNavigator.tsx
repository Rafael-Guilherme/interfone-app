import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { RoleSelectScreen } from '../screens/onboarding/RoleSelectScreen';
import { AuthScreen } from '../screens/onboarding/AuthScreen';
import { ManagerRegisterScreen } from '../features/manager/ManagerRegisterScreen';
import { RegisterSuccessScreen } from '../features/manager/RegisterSuccessScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ManagerRegister" component={ManagerRegisterScreen} />
      <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
