import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity as Button,
  Text,
  ActivityIndicator,
} from 'react-native';
import { std, rem } from '../styleguide';

const st = StyleSheet.create({
  main: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: std.color.shade3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    lineHeight: std.textSize.sm + std.gap.lg * 2,
    color: std.color.shade5,
    marginVertical: std.gap.lg,
  },
  abort: {
    width: rem(128),
    padding: std.gap.md,
    borderRadius: std.gap.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.danger,
    alignItems: 'center',
    marginBottom: std.gap.lg,
  },
  retry: {
    width: rem(128),
    padding: std.gap.md,
    borderRadius: std.gap.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.action,
    alignItems: 'center',
    marginBottom: std.gap.lg,
  },
  abortText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.danger,
  },
  retryText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.action,
  },
});

const SIPAuth = p => (
  <View style={st.main}>
    {p.failure || <ActivityIndicator />}
    {p.failure || <Text style={st.message}>CONNECTING TO SIP</Text>}
    {p.failure && <Text style={st.message}>CONNECTING FAILED</Text>}
    <Button style={st.abort} onPress={p.abort}>
      <Text style={st.abortText}>Abort</Text>
    </Button>
    {p.failure &&
      p.retryable && (
        <Button style={st.retry} onPress={p.retry}>
          <Text style={st.retryText}>Retry</Text>
        </Button>
      )}
  </View>
);

export default SIPAuth;
