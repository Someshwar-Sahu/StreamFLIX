import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { API_BASE_URL } from '../config';

export default function Watch({ route }: any) {
  const { id } = route.params;
 const uri = `${API_BASE_URL}/media/${id}/master.m3u8`;

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