import { StyleSheet, View, Image } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync();

export default function SplashScreen({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Image
        source={require('../assets/images/audit-logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
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
}); 