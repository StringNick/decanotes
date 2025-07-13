import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BlockProps } from '../types/editor';

const ImageBlock: React.FC<BlockProps> = ({ block }) => {
  if (block.type !== 'image') return null;
  const uri = block.meta?.url || '';
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});

export default ImageBlock; 