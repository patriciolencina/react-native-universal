import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity as Button,
  Text,
} from 'react-native';
import { std, rem } from '../styleguide';

const st = StyleSheet.create({
  notify: {
    flexDirection: 'row',
    alignItems: 'center',
    width: rem(320),
    backgroundColor: std.color.notice,
    marginBottom: std.gap.lg,
    alignSelf: 'flex-start',
    borderTopRightRadius: std.gap.lg,
    borderBottomRightRadius: std.gap.lg,
    shadowColor: std.color.shade9,
    shadowRadius: rem(8),
    shadowOpacity: 0.24,
    shadowOffset: {
      width: 0,
      height: rem(4),
    },
    elevation: 3,
  },
  notifyInfo: {
    flex: 1,
    paddingLeft: std.gap.lg,
    paddingVertical: std.gap.sm,
  },
  notifyCatalog: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    lineHeight: std.textSize.sm + std.gap.sm * 2,
    color: std.color.shade0,
  },
  notifyTitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.sm * 2,
    color: std.color.shade0,
  },
  notifySubtitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    lineHeight: std.textSize.sm + std.gap.sm * 2,
    color: std.color.shade0,
  },
  accept: {
    justifyContent: 'center',
    alignItems: 'center',
    width: std.iconSize.lg * 2,
    height: std.iconSize.lg * 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade0,
    borderRadius: std.iconSize.lg,
    marginHorizontal: std.gap.md,
  },
  acceptIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.lg,
    color: std.color.shade0,
  },
  reject: {
    justifyContent: 'center',
    alignItems: 'center',
    width: std.iconSize.lg * 2,
    height: std.iconSize.lg * 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade0,
    borderRadius: std.iconSize.lg,
    marginHorizontal: std.gap.md,
  },
  rejectIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.lg,
    color: std.color.shade0,
  },
});

const Notify = p => (
  <View style={st.notify}>
    <View style={st.notifyInfo}>
      <Text style={st.notifyCatalog}>
        {p.remoteVideoEnaled ? 'Incoming video call' : 'Incoming voice call'}
      </Text>
      <Text style={st.notifyTitle}>{p.partyName.toUpperCase()}</Text>
      <Text style={st.notifySubtitle}>{p.partyNumber}</Text>
    </View>
    <Button style={st.reject} onPress={() => p.reject(p.id)}>
      <Text style={st.rejectIcon}>icon_x</Text>
    </Button>
    <Button style={st.accept} onPress={() => p.accept(p.id)}>
      <Text style={st.acceptIcon}>icon_check</Text>
    </Button>
  </View>
);

const CallsNotify = p =>
  p.callIds.map(id => (
    <Notify
      key={id}
      {...p.resolveCall(id)}
      accept={p.accept}
      reject={p.reject}
    />
  ));

export default CallsNotify;
