import React from 'react';
import { RTCView } from 'react-native-webrtc';
import { StyleSheet, ActivityIndicator } from 'react-native';

const st = StyleSheet.create({ video: { flex: 1, alignSelf: 'stretch' } });

export default p =>
  p.source ? (
    <RTCView style={st.video} streamURL={p.source} />
  ) : (
    <ActivityIndicator />
  );
