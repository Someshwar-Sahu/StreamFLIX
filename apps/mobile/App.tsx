import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import Catalog from './src/screens/Catalog';
import Watch from './src/screens/Watch';
import Login from './src/screens/Login';
import Upload from './src/screens/Upload';
import SeriesDetail from './src/screens/SeriesDetail';
import ProfilePicker from './src/screens/ProfilePicker';
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
          <Stack.Screen name="Catalog" component={Catalog} />
          <Stack.Screen name="SeriesDetail" component={SeriesDetail} options={{ title: 'Series' }} />
          <Stack.Screen name="Upload" component={Upload} />
          <Stack.Screen name="Watch" component={Watch} options={({ route }: any) => ({ title: route.params?.title })} />
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