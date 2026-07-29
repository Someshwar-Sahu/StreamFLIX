import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import Watch from './src/screens/Watch';
import Login from './src/screens/Login';
import Upload from './src/screens/Upload';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SeriesDetail from './src/screens/SeriesDetail';
import WatchlistScreen from './src/screens/WatchlistScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileManageScreen from './src/screens/ProfileManageScreen';
import ProfilePicker from './src/screens/ProfilePicker';
import DownloadsScreen from './src/screens/DownloadsScreen';
import Admin from './src/screens/Admin';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#0D1117' },
  headerTintColor: '#F5F5F0',
  headerShadowVisible: false,
};

function RootNavigator() {
  const { token, profileToken, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0D1117' }}>
        <ActivityIndicator size="large" color="#F2A93B" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!token ? (
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      ) : !profileToken ? (
        <Stack.Screen name="ProfilePicker" component={ProfilePicker} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="SeriesDetail" component={SeriesDetail} options={{ title: 'Series' }} />
          <Stack.Screen name="Upload" component={Upload} options={{ title: 'Upload Content' }} />
          <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
          <Stack.Screen name="Watch" component={Watch} options={({ route }: any) => ({ title: route.params?.title })} />
          <Stack.Screen name="Watchlist" component={WatchlistScreen} options={{ title: 'Saved Watchlist' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Watch History' }} />
          <Stack.Screen name="Downloads" component={DownloadsScreen} options={{ title: 'Offline Downloads' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen name="ProfileManage" component={ProfileManageScreen} options={{ title: 'Manage Profiles' }} />
          <Stack.Screen name="Admin" component={Admin} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}