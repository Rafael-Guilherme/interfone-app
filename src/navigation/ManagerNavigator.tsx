import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../theme';
import type { ManagerStackParamList, ManagerTabParamList } from './types';
import { PanelScreen } from '../features/manager/PanelScreen';
import { StructureScreen } from '../features/manager/StructureScreen';
import { CommonAreasScreen } from '../features/manager/CommonAreasScreen';
import { ManagerProfileScreen } from '../features/manager/ManagerProfileScreen';
import { ResidentsScreen } from '../features/manager/ResidentsScreen';
import { ShareAccessScreen } from '../features/manager/ShareAccessScreen';
import { AnnounceComposeScreen } from '../features/manager/AnnounceComposeScreen';
import { QRCodesScreen } from '../features/manager/QRCodesScreen';
import { PackagesScreen } from '../features/manager/PackagesScreen';
import { ManagersScreen } from '../features/manager/ManagersScreen';
import { ContactsManageScreen } from '../features/manager/ContactsManageScreen';
import { EditInterfoneScreen } from '../features/manager/EditInterfoneScreen';
import { AreaBookingsScreen } from '../features/manager/AreaBookingsScreen';
import { AreaFormScreen } from '../features/manager/AreaFormScreen';

const RootStack = createNativeStackNavigator<ManagerStackParamList>();
const Tab = createBottomTabNavigator<ManagerTabParamList>();
const Inicio = createNativeStackNavigator<ManagerStackParamList>();
const Gestao = createNativeStackNavigator<ManagerStackParamList>();
const Comuns = createNativeStackNavigator<ManagerStackParamList>();

const noHeader = { headerShown: false as const, contentStyle: { backgroundColor: colors.bg } };

// Cada aba é uma pilha própria → a tab bar continua visível (e a aba ativa
// destacada) enquanto se navega para as subtelas daquela aba.
function InicioStack() {
  return (
    <Inicio.Navigator screenOptions={noHeader}>
      <Inicio.Screen name="Panel" component={PanelScreen} />
      <Inicio.Screen name="Residents" component={ResidentsScreen} />
      <Inicio.Screen name="Announce" component={AnnounceComposeScreen} />
      <Inicio.Screen name="QRCodes" component={QRCodesScreen} />
      <Inicio.Screen name="Packages" component={PackagesScreen} />
      <Inicio.Screen name="ShareAccess" component={ShareAccessScreen} />
    </Inicio.Navigator>
  );
}
function GestaoStack() {
  return (
    <Gestao.Navigator screenOptions={noHeader}>
      <Gestao.Screen name="Structure" component={StructureScreen} />
      <Gestao.Screen name="EditInfo" component={EditInterfoneScreen} />
      <Gestao.Screen name="Managers" component={ManagersScreen} />
      <Gestao.Screen name="Contacts" component={ContactsManageScreen} />
    </Gestao.Navigator>
  );
}
function ComunsStack() {
  return (
    <Comuns.Navigator screenOptions={noHeader}>
      <Comuns.Screen name="CommonAreas" component={CommonAreasScreen} />
      <Comuns.Screen name="AreaForm" component={AreaFormScreen} />
      <Comuns.Screen name="AreaBookings" component={AreaBookingsScreen} />
    </Comuns.Navigator>
  );
}

const tabIcon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;

function ManagerTabs() {
  return (
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
      <Tab.Screen name="Gestao" component={GestaoStack} options={{ tabBarLabel: 'Gestão', tabBarIcon: tabIcon('🛠️') }} />
      <Tab.Screen name="Comuns" component={ComunsStack} options={{ tabBarLabel: 'Comuns', tabBarIcon: tabIcon('🌳') }} />
      <Tab.Screen name="Perfil" component={ManagerProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

/** Área do gestor do interfone ATIVO. As abas trazem tudo; adicionar/trocar
 * interfone acontece no seletor (SelectNavigator), acessível por "trocar"/"Sair". */
export function ManagerApp() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={noHeader}>
        <RootStack.Screen name="Tabs" component={ManagerTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
