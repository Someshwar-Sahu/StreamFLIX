import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { DESIGN_TOKENS } from '@streamflix/ui';

export type QualityOption = {
  resolution: '1080p' | '720p' | '480p';
  label: string;
  sizeMb: number;
  description: string;
};

type Props = {
  visible: boolean;
  title: string;
  durationSeconds?: number;
  onClose: () => void;
  onSelectQuality: (option: QualityOption) => void;
};

export default function DownloadQualityModal({ visible, title, durationSeconds, onClose, onSelectQuality }: Props) {
  const [selectedRes, setSelectedRes] = useState<'1080p' | '720p' | '480p'>('720p');

  if (!visible) return null;

  // Calculate dynamic size based on video duration in seconds (fallback to 45 mins if not available)
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : 2700;
  const highMb = Math.max(1, Math.round((duration * 4.5) / 8));
  const medMb = Math.max(1, Math.round((duration * 2.2) / 8));
  const lowMb = Math.max(1, Math.round((duration * 0.9) / 8));

  const qualityOptions: QualityOption[] = [
    { resolution: '1080p', label: 'High (1080p)', sizeMb: highMb, description: 'Crisp Full HD • Best experience' },
    { resolution: '720p', label: 'Medium (720p)', sizeMb: medMb, description: 'Recommended • Great quality & speed' },
    { resolution: '480p', label: 'Low (480p)', sizeMb: lowMb, description: 'Data Saver • Fast download' },
  ];

  const handleStart = () => {
    const option = qualityOptions.find((q) => q.resolution === selectedRes) || qualityOptions[1];
    onSelectQuality(option);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.dragHandle} />

              <Text style={styles.sheetTitle}>Download Quality</Text>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {title} {durationSeconds ? `(${Math.floor(durationSeconds / 60)}m ${Math.floor(durationSeconds % 60)}s)` : ''}
              </Text>

              <View style={styles.optionsList}>
                {qualityOptions.map((opt) => {
                  const isSelected = opt.resolution === selectedRes;
                  return (
                    <TouchableOpacity
                      key={opt.resolution}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => setSelectedRes(opt.resolution)}
                    >
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.optionTextWrap}>
                        <View style={styles.labelRow}>
                          <Text style={styles.optionLabel}>{opt.label}</Text>
                          <Text style={styles.sizeText}>~{opt.sizeMb} MB</Text>
                        </View>
                        <Text style={styles.optionDesc}>{opt.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.downloadBtn} onPress={handleStart}>
                <Text style={styles.downloadBtnText}>📥 Start Download</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: 'rgba(23, 27, 36, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoTitle: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  optionCardSelected: {
    borderColor: DESIGN_TOKENS.colors.accentAmber,
    backgroundColor: 'rgba(242, 169, 59, 0.12)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: DESIGN_TOKENS.colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DESIGN_TOKENS.colors.accentAmber,
  },
  optionTextWrap: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  optionLabel: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sizeText: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontSize: 13,
    fontWeight: '700',
  },
  optionDesc: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 12,
  },
  downloadBtn: {
    backgroundColor: DESIGN_TOKENS.colors.accentAmber,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#0D1117',
    fontSize: 16,
    fontWeight: '700',
  },
});
