import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';

const { height, width } = Dimensions.get('window');

const CustomHeader = ({ title, titleStyle,height,width }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.1,
    color: '#532b88',
    fontWeight: '900',
    // textAlign:'right'
  },
});

export default CustomHeader;