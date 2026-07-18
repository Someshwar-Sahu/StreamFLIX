import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

export default function Watch({ route }: any) {
  const { id } = route.params;
  const uri = `http://10.81.197.182:8000/media/${id}/master.m3u8`;

  return (
    <View style={styles.container}>
      <Video
        source={{ uri }}
        style={styles.video}
        controls
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', height: 250 },
});