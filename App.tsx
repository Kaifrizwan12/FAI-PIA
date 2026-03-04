/**
 * FAI - Face Attendance App
 * React Native CLI version
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import NoInternetScreen from './src/components/NoInternetScreen';
import { useNetworkStatus } from './src/hooks/use-network-status';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { isConnected, refresh } = useNetworkStatus();

  // While the network status is being determined (null), render the app normally.
  // Once determined, if disconnected show the No Internet screen.
  if (isConnected === false) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NoInternetScreen onRetry={refresh} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
