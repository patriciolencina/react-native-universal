import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity as Button,
} from 'react-native';
import { std } from '../styleguide';

const st = {
  main: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: std.color.shade1,
    borderColor: std.color.shade4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  tabIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.md,
    lineHeight: std.iconSize.md + std.gap.md * 2,
    color: std.color.shade5,
  },
};

const Calls = p => (
  <Button style={st.tab} onPress={p.press}>
    <Text style={st.tabIcon}>icon_phone_pick</Text>
  </Button>
);

const Settings = p => (
  <Button style={st.tab} onPress={p.press}>
    <Text style={st.tabIcon}>icon_settings</Text>
  </Button>
);

const Users = p => (
  <Button style={st.tab} onPress={p.press}>
    <Text style={st.tabIcon}>icon_users</Text>
  </Button>
);

const Chats = p => (
  <Button style={st.tab} onPress={p.press}>
    <Text style={st.tabIcon}>icon_message_circle</Text>
  </Button>
);

const Books = p => (
  <Button style={st.tab} onPress={p.press}>
    <Text style={st.tabIcon}>icon_book</Text>
  </Button>
);

const Tabbar = p => (
  <View style={st.main}>
    <Books press={p.pressBooks} />
    <Users press={p.pressUsers} />
    <Calls press={p.pressCalls} />
    {p.chatsEnabled && <Chats press={p.pressChats} />}
    <Settings press={p.pressSettings} />
  </View>
);

export default Tabbar;
