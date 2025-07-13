import * as ImagePicker from 'expo-image-picker';
import React, { useCallback } from 'react';
import { Button, Image, StyleSheet, TextInput, View } from 'react-native';
import { BlockProps } from '../types/editor';

const EditableImageBlock: React.FC<BlockProps> = ({
  block,
  isEditing,
  onRawTextChange,    // <— text comes back here
  onBlur,
}) => {
  if (block.type !== 'image') return null;      // defensive

  const uri = block.meta?.url ?? block.content; // wherever you store it

  /* helper: pick from camera-roll */
  const pick = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) {
      const picked = res.assets[0].uri;
      onRawTextChange(picked);   // push into editor state
      onBlur();                  // leave edit mode
    }
  }, [onRawTextChange, onBlur]);

  /* 1️⃣ PREVIEW MODE */
  if (!isEditing) {
    return (
      <View style={styles.container}>
        {!!uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
      </View>
    );
  }

  /* 2️⃣ EDIT MODE */
  return (
    <View style={styles.container}>
      {!!uri && <Image source={{ uri }} style={styles.preview} resizeMode="contain" />}
      <TextInput
        placeholder="Image URL…"
        value={uri}
        onChangeText={onRawTextChange}
        onSubmitEditing={onBlur}
        style={styles.input}
      />
      <Button title="Pick from gallery" onPress={pick} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  image:     { width: '100%', height: 200, borderRadius: 8 },
  preview:   { width: '100%', height: 120, marginBottom: 8, borderRadius: 8 },
  input:     { width: '100%', padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 8 },
});

export default EditableImageBlock; 