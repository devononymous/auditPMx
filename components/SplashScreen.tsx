import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function CustomSplashScreen({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Video
        source={require('@/assets/splash-video.mp4')}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        isMuted={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  video: {
    flex: 1,
    width: '100%',
  },
}); 