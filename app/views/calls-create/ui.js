import React, { PureComponent, Fragment } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity as Button,
  Text,
  TextInput,
  Switch,
} from 'react-native';
import { std, rem } from '../styleguide';

const st = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: std.color.shade3,
  },
  navbar: {
    backgroundColor: std.color.shade1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: std.gap.sm,
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navbarTitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.shade9,
  },
  navbarLeftOpt: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: std.gap.lg,
    top: 0,
    bottom: 0,
    paddingRight: std.gap.lg,
  },
  navbarRightOpt: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: std.gap.lg,
    top: 0,
    bottom: 0,
    paddingLeft: std.gap.lg,
  },
  navbarOptText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.action,
  },
  opt: {
    backgroundColor: std.color.shade0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: std.gap.lg,
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optTitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.shade9,
  },
  videoSwitch: {
    marginLeft: 'auto',
  },
  targetInput: {
    flex: 1,
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: std.textSize.md + std.gap.md * 2,
    color: std.color.shade9,
  },
  divider: {
    paddingLeft: std.gap.lg,
    paddingTop: std.gap.lg * 2,
    paddingBottom: std.gap.lg,
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dividerTitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.shade5,
  },
  matches: {
    flex: 1,
    backgroundColor: std.color.shade0,
  },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: std.gap.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade4,
  },
  matchInfo: {
    flex: 1,
  },
  matchCalling: {
    width: std.gap.md,
    height: std.gap.md,
    borderRadius: std.gap.md / 2,
    backgroundColor: std.color.danger,
  },
  matchRinging: {
    width: std.gap.md,
    height: std.gap.md,
    borderRadius: std.gap.md / 2,
    backgroundColor: std.color.danger,
  },
  matchHolding: {
    width: std.gap.md,
    height: std.gap.md,
    borderRadius: std.gap.md / 2,
    backgroundColor: std.color.notice,
  },
  matchTalking: {
    width: std.gap.md,
    height: std.gap.md,
    borderRadius: std.gap.md / 2,
    backgroundColor: std.color.danger,
  },
  matchName: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    color: std.color.shade9,
    lineHeight: std.textSize.md + std.gap.md * 2,
  },
  matchNumber: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.shade5,
    lineHeight: std.textSize.sm + std.gap.sm * 2,
  },
});

const pure = Component =>
  class Pure extends PureComponent {
    render = () => <Component {...this.props} />;
  };

const Navbar = pure(p => (
  <View style={st.navbar}>
    <Button style={st.navbarLeftOpt} onPress={p.back}>
      <Text style={st.navbarOptText}>Back</Text>
    </Button>
    <Text style={st.navbarTitle}>Creating Call</Text>
    <Button style={st.navbarRightOpt} onPress={p.create}>
      <Text style={st.navbarOptText}>Create</Text>
    </Button>
  </View>
));

const Divider = pure(({ children }) => (
  <View style={st.divider}>
    <Text style={st.dividerTitle}>{children}</Text>
  </View>
));

const Options = p => (
  <Fragment>
    <Divider>OPTIONS</Divider>
    <View style={st.opt}>
      <Text style={st.optTitle}>Video</Text>
      <Switch
        style={st.videoSwitch}
        value={p.video}
        onValueChange={p.setVideo}
      />
    </View>
  </Fragment>
);

const Target = p => (
  <Fragment>
    <Divider>TARGET</Divider>
    <View style={st.opt}>
      <TextInput
        style={st.targetInput}
        autoFocus
        keyboardType="phone-pad"
        placeholder="Dial"
        value={p.target}
        onChangeText={p.setTarget}
      />
    </View>
  </Fragment>
);

const Match = p => (
  <Button style={st.match} onPress={() => p.select(p.number)}>
    <View style={st.matchInfo}>
      <Text style={st.matchName}>{p.name}</Text>
      <Text style={st.matchNumber}>{p.number}</Text>
    </View>
    {p.talking ? (
      <View style={st.matchTalking} />
    ) : p.ringing ? (
      <View style={st.matchRinging} />
    ) : p.calling ? (
      <View style={st.matchCalling} />
    ) : p.holding ? (
      <View style={st.matchHolding} />
    ) : null}
  </Button>
);

const Matches = p => (
  <ScrollView style={st.matches}>
    {p.ids.map(id => <Match key={id} {...p.resolve(id)} select={p.select} />)}
  </ScrollView>
);

const CallsCreate = p => (
  <View style={st.main}>
    <Navbar back={p.back} create={p.create} />
    <Options video={p.video} setVideo={p.setVideo} />
    <Target target={p.target} setTarget={p.setTarget} />
    <Matches ids={p.matchIds} resolve={p.resolveMatch} select={p.selectMatch} />
  </View>
);

export default CallsCreate;
