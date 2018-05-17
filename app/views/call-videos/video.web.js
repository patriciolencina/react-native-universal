import React from 'react';
import { ActivityIndicator } from 'react-native';

export default p =>
  p.source ? (
    <video autoPlay width="100%" height="100%" src={p.source} />
  ) : (
    <ActivityIndicator />
  );
