import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../theme';
import { ResidentHomeScreen } from '../features/resident/ResidentHomeScreen';
import { ComunicadosScreen } from '../features/resident/ComunicadosScreen';
import { ComunicadoDetalheScreen } from '../features/resident/ComunicadoDetalheScreen';
import { MeusQrScreen } from '../features/resident/MeusQrScreen';
import { ReservasScreen } from '../features/resident/ReservasScreen';
import { ReservaCalendarioScreen } from '../features/resident/ReservaCalendarioScreen';
import { RecadosScreen } from '../features/resident/RecadosScreen';
import { HistoricoScreen } from '../features/resident/HistoricoScreen';
import { EncomendasScreen } from '../features/resident/EncomendasScreen';
import { ContatosScreen } from '../features/resident/ContatosScreen';
import { FilaChamadaScreen } from '../features/resident/FilaChamadaScreen';
import { ManagerProfileScreen } from '../features/manager/ManagerProfileScreen';

const Tab = createBottomTabNavigator();
const Inicio = createNativeStackNavigator();
const Reservas = createNativeStackNavigator();

const noHeader = { headerShown: false as const, contentStyle: { backgroundColor: colors.bg } };
const tabIcon = (g: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{g}</Text>;

function InicioStack() {
  return (
    <Inicio.Navigator screenOptions={noHeader}>
      <Inicio.Screen name="Home" component={ResidentHomeScreen} />
      <Inicio.Screen name="Comunicados" component={ComunicadosScreen} />
      <Inicio.Screen name="ComunicadoDetalhe" component={ComunicadoDetalheScreen} />
      <Inicio.Screen name="MeusQr" component={MeusQrScreen} />
      <Inicio.Screen name="Historico" component={HistoricoScreen} />
      <Inicio.Screen name="Encomendas" component={EncomendasScreen} />
      <Inicio.Screen name="FilaChamada" component={FilaChamadaScreen} />
      <Inicio.Screen name="Contatos" component={ContatosScreen} />
    </Inicio.Navigator>
  );
}

/** Reservas em duas etapas: escolher a área e, depois, o dia no calendário. */
function ReservasStack() {
  return (
    <Reservas.Navigator screenOptions={noHeader}>
      <Reservas.Screen name="ReservasHome" component={ReservasScreen} />
      <Reservas.Screen name="ReservaCalendario" component={ReservaCalendarioScreen} />
    </Reservas.Navigator>
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
        <Tab.Screen name="Reservas" component={ReservasStack} options={{ tabBarLabel: 'Reservas', tabBarIcon: tabIcon('📅') }} />
        <Tab.Screen name="Recados" component={RecadosScreen} options={{ tabBarLabel: 'Recados', tabBarIcon: tabIcon('✉️') }} />
        <Tab.Screen name="Perfil" component={ManagerProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
