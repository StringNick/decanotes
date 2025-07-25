// app/(tabs)/index.tsx
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import MarkdownEditor from '../../components/editor/MarkdownEditor';

export default function EditorScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <MarkdownEditor
        placeholder="Start typing your notes..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});