import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../theme';
import { ResidentHomeScreen } from '../features/resident/ResidentHomeScreen';
import { ComunicadosScreen } from '../features/resident/ComunicadosScreen';
import { MeusQrScreen } from '../features/resident/MeusQrScreen';
import { ReservasScreen } from '../features/resident/ReservasScreen';
import { RecadosScreen } from '../features/resident/RecadosScreen';
import { HistoricoScreen } from '../features/resident/HistoricoScreen';
import { ManagerProfileScreen } from '../features/manager/ManagerProfileScreen';

const Tab = createBottomTabNavigator();
const Inicio = createNativeStackNavigator();

const noHeader = { headerShown: false as const, contentStyle: { backgroundColor: colors.bg } };
const tabIcon = (g: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{g}</Text>;

function InicioStack() {
  return (
    <Inicio.Navigator screenOptions={noHeader}>
      <Inicio.Screen name="Home" component={ResidentHomeScreen} />
      <Inicio.Screen name="Comunicados" component={ComunicadosScreen} />
      <Inicio.Screen name="MeusQr" component={MeusQrScreen} />
      <Inicio.Screen name="Historico" component={HistoricoScreen} />
    </Inicio.Navigator>
  );
}

/** Abas do morador: Início / Reservas / Recados / Perfil. */
export function ResidentNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: typography.weight.semibold },
        }}
      >
        <Tab.Screen name="Inicio" component={InicioStack} options={{ tabBarLabel: 'Início', tabBarIcon: tabIcon('🏠') }} />
        <Tab.Screen name="Reservas" component={ReservasScreen} options={{ tabBarLabel: 'Reservas', tabBarIcon: tabIcon('📅') }} />
        <Tab.Screen name="Recados" component={RecadosScreen} options={{ tabBarLabel: 'Recados', tabBarIcon: tabIcon('✉️') }} />
        <Tab.Screen name="Perfil" component={ManagerProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
