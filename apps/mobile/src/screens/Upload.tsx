import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMovie, createSeries, createSeason, uploadEpisode } from '../api/upload';
import { getSeries, getSeriesDetail } from '../api/catalog';
import CategoryTagSelector from '../components/CategoryTagSelector';

type FilePart = { uri: string; type?: string; name?: string };

export default function Upload({ navigation }: any) {
  const [tab, setTab] = useState<'movie' | 'series'>('movie');

  // movie
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mCategoriesList, setMCategoriesList] = useState<string[]>([]);
  const [mFile, setMFile] = useState<FilePart | null>(null);
  const [mPoster, setMPoster] = useState<FilePart | null>(null);

  // series
  const [seriesMode, setSeriesMode] = useState<'new' | 'existing'>('new');
  const [existingSeriesList, setExistingSeriesList] = useState<any[]>([]);
  const [seasonsList, setSeasonsList] = useState<any[]>([]);

  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategoriesList, setSCategoriesList] = useState<string[]>([]);
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

  useEffect(() => {
    if (tab === 'series') {
      getSeries()
        .then((list) => setExistingSeriesList(list || []))
        .catch(() => {});
    }
  }, [tab]);

  const handleSelectExistingSeries = async (sId: number) => {
    setSeriesId(sId);
    setSeasonId(null);
    try {
      const detail = await getSeriesDetail(sId);
      setSeasonsList(detail.seasons || []);
      if (detail.seasons && detail.seasons.length > 0) {
        setSeasonId(detail.seasons[0].id);
        const nextEp = (detail.seasons[0].episodes?.length || 0) + 1;
        setEpNumber(nextEp);
        setSeasonNumber(String(detail.seasons.length + 1));
      } else {
        setSeasonNumber('1');
      }
    } catch (err) {
      setError('Failed to load series details');
    }
  };

  const handleSelectSeason = (secId: number) => {
    setSeasonId(secId);
    const foundSeason = seasonsList.find((s) => s.id === secId);
    if (foundSeason) {
      const nextEp = (foundSeason.episodes?.length || 0) + 1;
      setEpNumber(nextEp);
    }
  };

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
      await uploadMovie({
        title: mTitle,
        description: mDesc,
        categoryNames: mCategoriesList.join(','),
        file: mFile,
        poster: mPoster,
      });
      navigation.navigate('MainTabs');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally { setBusy(false); }
  }

  async function handleCreateSeries() {
    setError(''); setBusy(true);
    try {
      const series = await createSeries({
        title: sTitle,
        description: sDesc,
        categoryNames: sCategoriesList.join(','),
        poster: sPoster,
      });
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

      // Instantly refresh seasons list for current series
      const detail = await getSeriesDetail(seriesId!);
      setSeasonsList(detail.seasons || []);
      setEpNumber(1);
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

      // Refresh seasons to keep episode count accurate
      const detail = await getSeriesDetail(seriesId!);
      setSeasonsList(detail.seasons || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Episode upload failed');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Upload Content</Text>

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

            <Text style={styles.label}>Select Categories</Text>
            <CategoryTagSelector selectedCategories={mCategoriesList} onChange={setMCategoriesList} />

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
            {/* Series Mode Selector */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.modeChip, seriesMode === 'new' && styles.modeChipActive]}
                onPress={() => { setSeriesMode('new'); setSeriesId(null); setSeasonId(null); }}
              >
                <Text style={[styles.modeText, seriesMode === 'new' && styles.modeTextActive]}>➕ Create New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, seriesMode === 'existing' && styles.modeChipActive]}
                onPress={() => { setSeriesMode('existing'); setSeriesId(null); setSeasonId(null); }}
              >
                <Text style={[styles.modeText, seriesMode === 'existing' && styles.modeTextActive]}>📺 Select Existing</Text>
              </TouchableOpacity>
            </View>

            {seriesMode === 'new' && !seriesId && (
              <View>
                <Text style={styles.subHeader}>Step 1 — Create Series</Text>
                <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#8A8F98" value={sTitle} onChangeText={setSTitle} />
                <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#8A8F98" value={sDesc} onChangeText={setSDesc} />

                <Text style={styles.label}>Select Categories</Text>
                <CategoryTagSelector selectedCategories={sCategoriesList} onChange={setSCategoriesList} />

                <TouchableOpacity style={styles.pickButton} onPress={() => pickPoster(setSPoster)}>
                  <Text style={styles.pickButtonText}>{sPoster ? sPoster.name : 'Choose Poster (optional)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleCreateSeries} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Series'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {seriesMode === 'existing' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>Tap an Existing Series</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {existingSeriesList.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.seriesCard, seriesId === s.id && styles.seriesCardActive]}
                      onPress={() => handleSelectExistingSeries(s.id)}
                    >
                      <Text style={[styles.seriesCardText, seriesId === s.id && styles.seriesCardTextActive]}>
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {seriesId && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Select Season</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {seasonsList.map((sec) => (
                        <TouchableOpacity
                          key={sec.id}
                          style={[styles.seasonChip, seasonId === sec.id && styles.seasonChipActive]}
                          onPress={() => handleSelectSeason(sec.id)}
                        >
                          <Text style={[styles.seasonText, seasonId === sec.id && styles.seasonTextActive]}>
                            Season {sec.season_number}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.seasonChip}
                        onPress={() => setSeasonId(null)}
                      >
                        <Text style={styles.seasonText}>+ New Season</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {seriesId && !seasonId && (
              <View style={{ marginTop: 12, padding: 14, backgroundColor: '#171B24', borderRadius: 8 }}>
                <Text style={styles.subHeader}>Add Season {seasonNumber}</Text>
                <TextInput style={styles.input} placeholder="Season Number" placeholderTextColor="#8A8F98" value={seasonNumber} onChangeText={setSeasonNumber} keyboardType="numeric" />
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleCreateSeason} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Season'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {seriesId && seasonId && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subHeader}>Upload Episode {epNumber}</Text>
                <TextInput style={styles.input} placeholder={`Episode Title (optional, e.g. Episode ${epNumber})`} placeholderTextColor="#8A8F98" value={epTitle} onChangeText={setEpTitle} />
                <TouchableOpacity style={styles.pickButton} onPress={() => pickVideo(setEpFile)}>
                  <Text style={styles.pickButtonText}>{epFile ? epFile.name : 'Choose Video File'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleUploadEpisode} disabled={busy}>
                  <Text style={styles.buttonText}>{busy ? 'Uploading...' : 'Upload Episode'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate('MainTabs')}>
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
  label: { fontSize: 13, color: '#8A8F98', marginBottom: 6 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', backgroundColor: '#171B24' },
  tabActive: { backgroundColor: '#F2A93B', borderColor: '#F2A93B' },
  tabText: { color: '#8A8F98', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#0D1117', fontWeight: '700' },
  modeChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#171B24' },
  modeChipActive: { borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.15)' },
  modeText: { color: '#8A8F98', fontSize: 12 },
  modeTextActive: { color: '#F2A93B', fontWeight: '700' },
  seriesCard: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#171B24', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10 },
  seriesCardActive: { borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.15)' },
  seriesCardText: { color: '#F5F5F0', fontSize: 13 },
  seriesCardTextActive: { color: '#F2A93B', fontWeight: '700' },
  seasonChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#171B24', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  seasonChipActive: { borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.15)' },
  seasonText: { color: '#8A8F98', fontSize: 12 },
  seasonTextActive: { color: '#F2A93B', fontWeight: '700' },
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