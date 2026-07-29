import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MoviesScreen from '../screens/MoviesScreen';
import SeriesScreen from '../screens/SeriesScreen';
import SearchScreen from '../screens/SearchScreen';
import MySpaceScreen from '../screens/MySpaceScreen';
import { DESIGN_TOKENS } from '@streamflix/ui';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji }: { emoji: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, lineHeight: 22, textAlign: 'center' }}>{emoji}</Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: DESIGN_TOKENS.colors.bgVoid,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          height: 84,
          paddingBottom: 28,
          paddingTop: 14,
        },
        tabBarActiveTintColor: DESIGN_TOKENS.colors.accentAmber,
        tabBarInactiveTintColor: DESIGN_TOKENS.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="MoviesTab"
        component={MoviesScreen}
        options={{
          tabBarLabel: 'Movies',
          tabBarIcon: () => <TabIcon emoji="🎬" />,
        }}
      />
      <Tab.Screen
        name="SeriesTab"
        component={SeriesScreen}
        options={{
          tabBarLabel: 'Series',
          tabBarIcon: () => <TabIcon emoji="📺" />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: () => <TabIcon emoji="🔍" />,
        }}
      />
      <Tab.Screen
        name="MySpaceTab"
        component={MySpaceScreen}
        options={{
          tabBarLabel: 'My Space',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}
