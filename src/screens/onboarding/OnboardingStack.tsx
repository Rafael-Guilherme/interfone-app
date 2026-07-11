/**
 * Fluxo de entrada (①) com as telas reais conectadas à API.
 * CondoCode e demais telas sem lógica de API seguem como stub simples.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import { ScreenPlaceholder } from '../components/ScreenPlaceholder';
import { Field, PrimaryButton, ScreenTitle } from '../components/ui';
import { colors, spacing } from '../theme';
import { LoginScreen } from '../features/onboarding/LoginScreen';
import { VerifyCodeScreen } from '../features/onboarding/VerifyCodeScreen';
import { ConfirmCondoScreen } from '../features/onboarding/ConfirmCondoScreen';
import { YourDataScreen } from '../features/onboarding/YourDataScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const Welcome = () => <ScreenPlaceholder title="Boas-vindas" />;

/** Código do condomínio (①·4) — digita o código e segue para confirmação. */
function CondoCodeScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'CondoCode'>) {
  const [code, setCode] = useState('');
  return (
    <View style={styles.screen}>
      <ScreenTitle
        title="Código do condomínio"
        subtitle="Digite o código que o síndico compartilhou, ou escaneie o QR."
      />
      <Field
        label="Código"
        value={code}
        onChangeText={setCode}
        placeholder="Ex.: AURORA-4821"
        autoCapitalize="characters"
      />
      <PrimaryButton
        label="Continuar"
        onPress={() => navigation.navigate('ConfirmCondo', { joinCode: code.trim() })}
        disabled={code.trim().length < 3}
      />
    </View>
  );
}

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="CondoCode" component={CondoCodeScreen} />
      <Stack.Screen name="ConfirmCondo" component={ConfirmCondoScreen} />
      {/* BlockAndUnit hospeda a tela consolidada de dados + join */}
      <Stack.Screen name="BlockAndUnit" component={YourDataScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
});
