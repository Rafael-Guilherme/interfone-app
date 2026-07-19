import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { InterfoneSelectScreen } from '../features/manager/InterfoneSelectScreen';
import { AddRoleScreen } from '../features/manager/AddRoleScreen';
import { JoinUnitScreen } from '../features/manager/JoinUnitScreen';
import { SindicoStartScreen } from '../features/manager/SindicoStartScreen';
import { ManagerRegisterScreen } from '../features/manager/ManagerRegisterScreen';
import { FinishAccountScreen } from '../features/manager/FinishAccountScreen';
import { CompleteProfileScreen } from '../features/manager/CompleteProfileScreen';
import { RegisterSuccessScreen } from '../features/manager/RegisterSuccessScreen';

const Stack = createNativeStackNavigator();

/**
 * Pós-login, sem interfone/cargo ativo selecionado: escolher entre os interfones
 * do usuário (todos os cargos) ou adicionar/cadastrar um novo.
 */
export function SelectNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="InterfoneSelect" component={InterfoneSelectScreen} />
        <Stack.Screen name="AddRole" component={AddRoleScreen} />
        <Stack.Screen name="JoinUnit" component={JoinUnitScreen} />
        <Stack.Screen name="SindicoStart" component={SindicoStartScreen} />
        <Stack.Screen name="ManagerRegister" component={ManagerRegisterScreen} />
        <Stack.Screen name="FinishAccount" component={FinishAccountScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
