import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { DESIGN_TOKENS } from '@streamflix/ui';

type Props = {
  visible: boolean;
  title: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export default function DeleteSafetyModal({ visible, title, onConfirm, onClose }: Props) {
  const [confirmInput, setConfirmInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete title');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.headerRow}>
                <Text style={styles.dangerTitle}>⚠️ Danger Zone — Delete Title</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.bodyText}>
                Are you sure you want to delete <Text style={styles.titleHighlight}>"{title}"</Text>?
              </Text>

              <Text style={styles.warningText}>
                This action <Text style={styles.redHighlight}>cannot be undone</Text>. This will permanently delete media files, streaming playlists, ratings, and watch history from StreamFlix.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>
                  To confirm, type <Text style={styles.redHighlight}>DELETE</Text> below:
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type DELETE to confirm..."
                  placeholderTextColor={DESIGN_TOKENS.colors.textMuted}
                  value={confirmInput}
                  onChangeText={setConfirmInput}
                  autoCapitalize="characters"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    { opacity: isConfirmed && !busy ? 1 : 0.4 },
                  ]}
                  onPress={handleDelete}
                  disabled={!isConfirmed || busy}
                >
                  <Text style={styles.deleteText}>{busy ? 'Deleting...' : 'Delete Permanently'}</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(239, 71, 111, 0.4)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dangerTitle: {
    color: DESIGN_TOKENS.colors.dangerRed,
    fontSize: 16,
    fontWeight: '700',
  },
  closeIcon: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 18,
  },
  bodyText: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  titleHighlight: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontWeight: '700',
  },
  warningText: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  redHighlight: {
    color: DESIGN_TOKENS.colors.dangerRed,
    fontWeight: '700',
  },
  inputWrap: {
    marginBottom: 16,
  },
  label: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: DESIGN_TOKENS.colors.bgVoid,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: DESIGN_TOKENS.colors.dangerRed,
    fontSize: 12,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelText: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DESIGN_TOKENS.colors.dangerRed,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
