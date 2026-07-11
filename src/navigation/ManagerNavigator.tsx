import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { ManagerStackParamList } from './types';
import { PanelScreen } from '../features/manager/PanelScreen';
import { ResidentsScreen } from '../features/manager/ResidentsScreen';
import { ShareAccessScreen } from '../features/manager/ShareAccessScreen';

const Stack = createNativeStackNavigator<ManagerStackParamList>();

/** Área do síndico aprovado. NavigationContainer próprio (irmão do onboarding). */
export function ManagerApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Panel" component={PanelScreen} />
        <Stack.Screen name="Residents" component={ResidentsScreen} />
        <Stack.Screen name="ShareAccess" component={ShareAccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
