import { StyleSheet, View, Image, Text } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useState } from 'react';

ExpoSplashScreen.preventAutoHideAsync();

export default function SplashScreen({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Image
        source={require('../assets/images/audit-logo.png')}
        style={styles.image}
        resizeMode="contain"
        onError={(error) => {
          console.error('Image loading error:', error.nativeEvent.error);
          setImageError(true);
        }}
        onLoad={() => console.log('Image loaded successfully')}
      />
      {imageError && (
        <Text style={styles.errorText}>
          Failed to load image
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
}); 