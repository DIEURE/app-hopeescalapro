import React, { useEffect } from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, Music, Home, Menu } from "lucide-react-native";
import * as NavigationBar from "expo-navigation-bar";

import HomeScreen from "../screens/home/HomeScreen";
import MinhasEscalasScreen from "../screens/escalas/MinhasEscalasScreen";
import RepertorioScreen from "../screens/repertorio/RepertorioScreen";
import MaisScreen from "../screens/mais/MaisScreen";

import { NotificacoesHeaderMobile } from "../components/common/NotificacoesHeaderMobile";

const Tab = createBottomTabNavigator();

export default function AppTabNavigator() {
  const insets = useSafeAreaInsets();

  const paddingInferior =
    insets.bottom > 0 ? insets.bottom : Platform.OS === "android" ? 6 : 8;
  const alturaBarra =
    (Platform.OS === "android" ? 54 : 52) +
    (insets.bottom > 0 ? insets.bottom : 6);

  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        const navBar = NavigationBar as any;
        if (typeof navBar.setBackgroundColorAsync === "function") {
          navBar.setBackgroundColorAsync("#FFFFFF");
        }
        if (typeof navBar.setButtonStyleAsync === "function") {
          navBar.setButtonStyleAsync("dark");
        }
      } catch (error) {
        // Ignora caso esteja rodando em emulador ou ambiente sem suporte
      }
    }
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: alturaBarra,
          paddingBottom: paddingInferior,
          paddingTop: 4,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerRight: () => <NotificacoesHeaderMobile />,
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#FFF",
          tabBarLabel: "Início",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Escalas"
        component={MinhasEscalasScreen}
        options={{
          tabBarLabel: "Minhas Escalas",
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Repertorio"
        component={RepertorioScreen}
        options={{
          tabBarLabel: "Repertório",
          tabBarIcon: ({ color }) => <Music color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Mais"
        component={MaisScreen}
        options={{
          tabBarLabel: "Mais",
          tabBarIcon: ({ color }) => <Menu color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
}
