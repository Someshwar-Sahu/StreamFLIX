import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../api/client';

export default function Upload({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function pickFile() {
    const result = await launchImageLibrary({ mediaType: 'video' })
    if (result.didCancel) return
    if (result.errorCode) {
        setError('Failed to pick file')
        return
    }
    const asset = result.assets?.[0]
    if (asset){
        setFile({ uri: asset.uri, type: asset.type, name: asset.fileName })
    }
  }

  async function handleUpload() {
    if (!file) {
      setError('Please select a video file');
      return;
    }
    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'video/mp4',
      name: file.name || 'upload.mp4',
    } as any);

    try {
      await api.post('/content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigation.navigate('Catalog');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Upload</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
      />
      <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
        <Text style={styles.pickButtonText}>
          {file ? file.name : 'Choose Video File'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, uploading && { opacity: 0.5 }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12,
    color: '#fff', marginBottom: 12,
  },
  pickButton: {
    borderWidth: 1, borderColor: '#1e90ff', borderRadius: 8, padding: 14,
    alignItems: 'center', marginBottom: 12,
  },
  pickButtonText: { color: '#1e90ff' },
  button: { backgroundColor: '#1e90ff', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', marginTop: 12 },
});