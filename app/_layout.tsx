import React from 'react';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Add any custom fonts here if needed
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Slot />;
}
