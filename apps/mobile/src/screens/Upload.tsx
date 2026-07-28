import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMovie, createSeries, createSeason, uploadEpisode } from '../api/upload';

type FilePart = { uri: string; type?: string; name?: string };

export default function Upload({ navigation }: any) {
  const [tab, setTab] = useState<'movie' | 'series'>('movie');

  // movie
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mCategories, setMCategories] = useState('');
  const [mFile, setMFile] = useState<FilePart | null>(null);
  const [mPoster, setMPoster] = useState<FilePart | null>(null);

  // series
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategories, setSCategories] = useState('');
  const [sPoster, setSPoster] = useState<FilePart | null>(null);
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [seasonNumber, setSeasonNumber] = useState('1');
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  const [epFile, setEpFile] = useState<FilePart | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function pickVideo(setter: (f: FilePart) => void) {
    const result = await launchImageLibrary({ mediaType: 'video' });
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (asset) setter({ uri: asset.uri!, type: asset.type, name: asset.fileName });
  }

  async function pickPoster(setter: (f: FilePart) => void) {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (asset) setter({ uri: asset.uri!, type: asset.type, name: asset.fileName });
  }

  async function handleMovieUpload() {
    if (!mFile) { setError('Please select a video file'); return; }
    setError(''); setBusy(true);
    try {
      await uploadMovie({ title: mTitle, description: mDesc, categoryNames: mCategories, file: mFile, poster: mPoster });
      navigation.navigate('Catalog');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally { setBusy(false); }
  }

  async function handleCreateSeries() {
    setError(''); setBusy(true);
    try {
      const series = await createSeries({ title: sTitle, description: sDesc, categoryNames: sCategories, poster: sPoster });
      setSeriesId(series.id);
      setSuccess(`Series created (#${series.id}). Now add a season.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Series creation failed');
    } finally { setBusy(false); }
  }

  async function handleCreateSeason() {
    setError(''); setBusy(true);
    try {
      const season = await createSeason(seriesId!, Number(seasonNumber));
      setSeasonId(season.id);
      setSuccess(`Season ${season.season_number} created. Now upload episodes.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Season creation failed');
    } finally { setBusy(false); }
  }

  async function handleUploadEpisode() {
    if (!epFile) { setError('Please select a video file'); return; }
    setError(''); setBusy(true);
    try {
      await uploadEpisode(seriesId!, seasonId!, { episodeNumber: epNumber, title: epTitle, file: epFile });
      setSuccess(`Episode ${epNumber} uploaded and processing.`);
      setEpNumber((n) => n + 1);
      setEpTitle('');
      setEpFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Episode upload failed');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Upload</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'movie' && styles.tabActive]} onPress={() => setTab('movie')}>
            <Text style={[styles.tabText, tab === 'movie' && styles.tabTextActive]}>Movie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'series' && styles.tabActive]} onPress={() => setTab('series')}>
            <Text style={[styles.tabText, tab === 'series' && styles.tabTextActive]}>Series</Text>
          </TouchableOpacity>
        </View>

        {tab === 'movie' && (
          <View>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#8A8F98" value={mTitle} onChangeText={setMTitle} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#8A8F98" value={mDesc} onChangeText={setMDesc} />
            <TextInput style={styles.input} placeholder="Categories (comma-separated)" placeholderTextColor="#8A8F98" value={mCategories} onChangeText={setMCategories} />
            <TouchableOpacity style={styles.pickButton} onPress={() => pickVideo(setMFile)}>
              <Text style={styles.pickButtonText}>{mFile ? mFile.name : 'Choose Video File'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickButton} onPress={() => pickPoster(setMPoster)}>
              <Text style={styles.pickButtonText}>{mPoster ? mPoster.name : 'Choose Poster (optional)'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleMovieUpload} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? 'Uploading...' : 'Upload Movie'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'series' && (
          <View>
            {!seriesId && (
              <View>
                <Text style={styles.subHeader}>Step 1 — Create Series</Text>
                <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#8A8F98" value={sTitle} onChangeText={setSTitle} />
                <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#8A8F98" value={sDesc} onChangeText={setSDesc} />
                <TextInput style={styles.input} placeholder="Categories (comma-separated)" placeholderTextColor="#8A8F98" value={sCategories} onChangeText={setSCategories} />
                <TouchableOpacity style={styles.pickButton} onPress={() => pickPoster(setSPoster)}>
                  <Text style={styles.pickButtonText}>{sPoster ? sPoster.name : 'Choose Poster (optional)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleCreateSeries} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Series'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {seriesId && !seasonId && (
              <View>
                <Text style={styles.subHeader}>Step 2 — Add Season</Text>
                <TextInput style={styles.input} placeholder="Season Number" placeholderTextColor="#8A8F98" value={seasonNumber} onChangeText={setSeasonNumber} keyboardType="numeric" />
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleCreateSeason} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Season'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {seriesId && seasonId && (
              <View>
                <Text style={styles.subHeader}>Step 3 — Upload Episode {epNumber}</Text>
                <TextInput style={styles.input} placeholder="Episode Title (optional)" placeholderTextColor="#8A8F98" value={epTitle} onChangeText={setEpTitle} />
                <TouchableOpacity style={styles.pickButton} onPress={() => pickVideo(setEpFile)}>
                  <Text style={styles.pickButtonText}>{epFile ? epFile.name : 'Choose Video File'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleUploadEpisode} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Uploading...' : 'Upload Episode'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate('Catalog')}>
                  <Text style={styles.doneButtonText}>Done — Go to Catalog</Text>
                </TouchableOpacity>
              </View>
            )}

            {success ? <Text style={styles.success}>{success}</Text> : null}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { fontSize: 24, fontWeight: '700', color: '#F5F5F0', marginBottom: 20 },
  subHeader: { fontSize: 15, fontWeight: '600', color: '#F5F5F0', marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', backgroundColor: '#171B24' },
  tabActive: { backgroundColor: '#F2A93B', borderColor: '#F2A93B' },
  tabText: { color: '#8A8F98', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#0D1117', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', borderRadius: 8, padding: 12, color: '#F5F5F0', backgroundColor: '#171B24', marginBottom: 12, fontSize: 14 },
  pickButton: { borderWidth: 1, borderColor: 'rgba(242,169,59,0.4)', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  pickButtonText: { color: '#F2A93B', fontSize: 13 },
  button: { backgroundColor: '#F2A93B', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#0D1117', fontWeight: '700' },
  doneButton: { padding: 10, alignItems: 'center' },
  doneButtonText: { color: '#8A8F98', fontSize: 13, textDecorationLine: 'underline' },
  error: { color: '#EF476F', marginTop: 12, fontSize: 13 },
  success: { color: '#2EC4B6', marginTop: 12, fontSize: 13 },
});