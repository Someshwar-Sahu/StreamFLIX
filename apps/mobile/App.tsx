import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator,View } from 'react-native';
import Catalog from './src/screens/Catalog';
import Watch from './src/screens/Watch';
import Login from './src/screens/Login';
import Upload from './src/screens/Upload';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

function RootNavigator(){
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex:1, justifyContent: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name='Catalog' component={Catalog} />
          <Stack.Screen name='Upload' component={Upload} />
          <Stack.Screen name='Watch' component={Watch} options={({ route }: any) => ({ title: route.params?.title })} />
        </>
      ) : (
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false}} />
      )}
    </Stack.Navigator>
  )
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