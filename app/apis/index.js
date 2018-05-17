import { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import pbx from './pbx';
import sip from './sip';
import uc from './uc';

const mapGetter = getter => state => ({
  profile: getter.auth.profile(state),
  runningCallById: getter.runningCalls.detailMapById(state),
  pbxUserById: getter.pbxUsers.detailMapById(state),
});

const mapAction = action => emit => ({
  onPBXConnectionStopped() {
    emit(action.auth.pbx.onStopped());
  },
  onSIPConnectionStarted() {
    emit(action.auth.sip.onSuccess());
  },
  onSIPConnectionStopped() {
    emit(action.auth.sip.onStopped());
  },
  onUCConnectionStopped() {
    emit(action.auth.uc.onStopped());
  },
  createRunningCall(call) {
    emit(action.runningCalls.create(call));
  },
  updateRunningCall(call) {
    emit(action.runningCalls.update(call));
  },
  removeRunningCall(call) {
    emit(action.runningCalls.remove(call));
  },
  createParkingCall(call) {
    emit(action.parkingCalls.create(call));
  },
  removeParkingCall(call) {
    emit(action.parkingCalls.remove(call));
  },
  fillPbxUsers(users) {
    emit(action.pbxUsers.refill(users));
  },
  setPBXUserTalkerCalling(user, talker) {
    emit(action.pbxUsers.setTalkerCalling(user, talker));
  },
  setPBXUserTalkerRinging(user, talker) {
    emit(action.pbxUsers.setTalkerRinging(user, talker));
  },
  setPBXUserTalkerTalking(user, talker) {
    emit(action.pbxUsers.setTalkerTalking(user, talker));
  },
  setPBXUserTalkerHolding(user, talker) {
    emit(action.pbxUsers.setTalkerHolding(user, talker));
  },
  setPBXUserTalkerHanging(user, talker) {
    emit(action.pbxUsers.setTalkerHanging(user, talker));
  },
  createRecentCall(call) {
    emit(action.recentCalls.create(call));
  },
  updateUcUser(user) {
    emit(action.ucUsers.update(user));
  },
  appendBuddyChat(buddy, chat) {
    emit(action.buddyChats.appendByBuddy(buddy, [chat]));
  },
  appendGroupChat(group, chat) {
    emit(action.groupChats.appendByGroup(group, [chat]));
  },
  createChatGroup(group) {
    emit(action.chatGroups.create(group));
  },
  updateChatGroup(group) {
    emit(action.chatGroups.update(group));
  },
  removeChatGroup(id) {
    emit(action.chatGroups.remove(id));
  },
  clearChatsByGroup(group) {
    emit(action.groupChats.clearByGroup(group));
  },
  createChatFile(file) {
    emit(action.chatFiles.create(file));
  },
  updateChatFile(file) {
    emit(action.chatFiles.update(file));
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
});

class APIProvider extends Component {
  static childContextTypes = {
    pbx: PropTypes.object.isRequired,
    sip: PropTypes.object.isRequired,
    uc: PropTypes.object.isRequired,
  };

  static defaultProps = {
    runningCallById: {},
    pbxUserById: {},
  };

  getChildContext() {
    return { pbx, sip, uc };
  }

  componentDidMount() {
    pbx.on('connection-started', this.onPBXConnectionStarted);
    pbx.on('connection-stopped', this.onPBXConnectionStopped);

    pbx.on('park-started', this.onPBXParkStarted);
    pbx.on('park-stopped', this.onPBXParkStopped);

    pbx.on('user-calling', this.onPBXUserCalling);
    pbx.on('user-ringing', this.onPBXUserRinging);
    pbx.on('user-talking', this.onPBXUserTalking);
    pbx.on('user-holding', this.onPBXUserHolding);
    pbx.on('user-hanging', this.onPBXUserHanging);

    sip.on('connection-started', this.onSIPConnectionStarted);
    sip.on('connection-stopped', this.onSIPConnectionStopped);

    sip.on('session-started', this.onSIPSessionStarted);
    sip.on('session-updated', this.onSIPSessionUpdated);
    sip.on('session-stopped', this.onSIPSessionStopped);

    uc.on('connection-stopped', this.onUCConnectionStopped);
    uc.on('user-updated', this.onUcUserUpdated);
    uc.on('buddy-chat-created', this.onBuddyChatCreated);
    uc.on('group-chat-created', this.onGroupChatCreated);
    uc.on('chat-group-invited', this.onChatGroupInvited);
    uc.on('chat-group-revoked', this.onChatGroupRevoked);
    uc.on('chat-group-updated', this.onChatGroupUpdated);
    uc.on('file-received', this.onFileReceived);
    uc.on('file-progress', this.onFileProgress);
    uc.on('file-finished', this.onFileFinished);
  }

  componentWillUnmount() {
    pbx.off('connection-started', this.onPBXConnectionStarted);
    pbx.off('connection-stopped', this.onPBXConnectionStopped);

    pbx.off('park-started', this.onPBXParkStarted);
    pbx.off('park-stopped', this.onPBXParkStopped);

    pbx.off('user-calling', this.onPBXUserCalling);
    pbx.off('user-ringing', this.onPBXUserRinging);
    pbx.off('user-talking', this.onPBXUserTalking);
    pbx.off('user-holding', this.onPBXUserHolding);
    pbx.off('user-hanging', this.onPBXUserHanging);

    sip.off('connection-started', this.onSIPConnectionStarted);
    sip.off('connection-stopped', this.onSIPConnectionStopped);

    sip.off('session-started', this.onSIPSessionStarted);
    sip.off('session-updated', this.onSIPSessionUpdated);
    sip.off('session-stopped', this.onSIPSessionStopped);

    uc.off('connection-stopped', this.onUCConnectionStopped);
    uc.off('user-updated', this.onUcUserUpdated);
    uc.off('buddy-chat-created', this.onBuddyChatCreated);
    uc.off('group-chat-created', this.onGroupChatCreated);
    uc.off('chat-group-invited', this.onChatGroupInvited);
    uc.off('chat-group-revoked', this.onChatGroupRevoked);
    uc.off('chat-group-updated', this.onChatGroupUpdated);
    uc.off('file-received', this.onFileReceived);
    uc.off('file-progress', this.onFileProgress);
    uc.off('file-finished', this.onFileFinished);
  }

  onPBXConnectionStarted = () => {
    this.loadPbxUsers().catch(err => {
      this.props.showToast('Failed to load PBX users');
      console.error(err);
    });
  };

  onPBXConnectionStopped = () => {
    this.props.onPBXConnectionStopped();
  };

  async loadPbxUsers() {
    const { profile } = this.props;
    if (!profile) return;

    const tenant = profile.pbxTenant;
    const username = profile.pbxUsername;

    const userIds = await pbx
      .getUsers(tenant)
      .then(ids => ids.filter(id => id !== username));
    const users = await Promise.all(userIds.map(id => pbx.getUser(tenant, id)));

    this.props.fillPbxUsers(users);
  }

  onPBXUserCalling = ev => {
    this.props.setPBXUserTalkerCalling(ev.user, ev.talker);
  };

  onPBXUserRinging = ev => {
    this.props.setPBXUserTalkerRinging(ev.user, ev.talker);
  };

  onPBXUserTalking = ev => {
    this.props.setPBXUserTalkerTalking(ev.user, ev.talker);
  };

  onPBXUserHolding = ev => {
    this.props.setPBXUserTalkerHolding(ev.user, ev.talker);
  };

  onPBXUserHanging = ev => {
    this.props.setPBXUserTalkerHanging(ev.user, ev.talker);
  };

  onPBXParkStarted = park => {
    this.props.createParkingCall(park);
  };

  onPBXParkStopped = park => {
    this.props.removeParkingCall(park);
  };

  onSIPConnectionStarted = () => {
    this.props.onSIPConnectionStarted();
  };

  onSIPConnectionStopped = () => {
    this.props.onSIPConnectionStopped();
  };

  onSIPSessionStarted = call => {
    const number = call.partyNumber;

    if (number === '8') {
      call.partyName = 'Voicemails';
    }

    if (!call.partyName) {
      const { pbxUserById } = this.props;
      const pbxUser = pbxUserById[number];
      call.partyName = pbxUser ? pbxUser.name : 'Unnamed';
    }

    this.props.createRunningCall(call);
  };

  onSIPSessionUpdated = call => {
    this.props.updateRunningCall(call);
  };

  onSIPSessionStopped = id => {
    const call = this.props.runningCallById[id];

    this.props.createRecentCall({
      id: createID(),
      incoming: call.incoming,
      answered: call.answered,
      partyName: call.partyName,
      partyNumber: call.partyNumber,
      profile: this.props.profile.id,
      created: Date.now(),
    });
    this.props.removeRunningCall(call.id);
  };

  onUCConnectionStopped = () => {
    this.props.onUCConnectionStopped();
  };

  onUcUserUpdated = ev => {
    this.props.updateUcUser(ev);
  };

  onBuddyChatCreated = chat => {
    this.props.appendBuddyChat(chat.creator, chat);
  };

  onGroupChatCreated = chat => {
    this.props.appendGroupChat(chat.group, chat);
  };

  onChatGroupInvited = group => {
    this.props.createChatGroup(group);
  };

  onChatGroupUpdated = group => {
    this.props.updateChatGroup(group);
  };

  onChatGroupRevoked = group => {
    this.props.removeChatGroup(group.id);
    this.props.clearChatsByGroup(group.id);
  };

  onFileReceived = file => {
    this.props.createChatFile(file);
  };

  onFileProgress = file => {
    this.props.updateChatFile(file);
  };

  onFileFinished = file => {
    this.props.updateChatFile(file);
  };

  render() {
    return this.props.children;
  }
}

export default createModelView(mapGetter, mapAction)(APIProvider);
