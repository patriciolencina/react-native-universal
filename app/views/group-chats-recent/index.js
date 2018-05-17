import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => (state, props) => ({
  group: getter.chatGroups.detailMapById(state)[props.match.params.group],
  chatIds: getter.groupChats.idsMapByGroup(state)[props.match.params.group],
  chatById: getter.groupChats.detailMapById(state),
  ucUserById: getter.ucUsers.detailMapById(state),
});

const mapAction = action => emit => ({
  appendChats(group, chats) {
    emit(action.groupChats.appendByGroup(group, chats));
  },
  prependChats(group, chats) {
    emit(action.groupChats.prependByGroup(group, chats));
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
  routeToChatsRecent() {
    emit(action.router.goToChatsRecent());
  },
  removeChatGroup(id) {
    emit(action.chatGroups.remove(id));
  },
  clearChatsByGroup(group) {
    emit(action.groupChats.clearByGroup(group));
  },
  routeToChatGroupInvite(group) {
    emit(action.router.goToChatGroupInvite(group));
  },
});

const monthName = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const isToday = time => {
  const now = new Date();
  const beginOfToday = now.setHours(0, 0, 0, 0);
  const endOfTday = now.setHours(23, 59, 59, 999);
  return time >= beginOfToday && time <= endOfTday;
};

const formatTime = time => {
  time = new Date(time);
  const hour = time
    .getHours()
    .toString()
    .padStart(2, '0');
  const min = time
    .getMinutes()
    .toString()
    .padStart(2, '0');
  if (isToday(time)) return `${hour}:${min}`;

  const month = monthName[time.getMonth()];
  const day = time.getDate();
  return `${month} ${day} - ${hour}:${min}`;
};

const miniChatDuration = 60000; // 60 seconds

const isMiniChat = (chat, prev = {}) =>
  chat.creator === prev.creator &&
  chat.created - prev.created < miniChatDuration;

const numberOfChatsPerLoad = 50;

class View extends Component {
  static contextTypes = {
    uc: PropTypes.object.isRequired,
  };

  static defaultProps = {
    group: { members: [] },
    chatIds: [],
    chatById: {},
    ucUserById: {},
  };

  state = {
    loadingRecent: false,
    loadingMore: false,
    editingText: '',
  };

  componentDidMount() {
    const { chatIds } = this.props;
    const noChat = !chatIds.length;
    if (noChat) this.loadRecent();
  }

  render = () => (
    <UI
      hasMore={this.props.chatIds.length > 0 && !this.state.loadingMore}
      groupName={this.props.group.name}
      members={this.props.group.members}
      resolveMember={this.resolveBuddy}
      loadingRecent={this.state.loadingRecent}
      loadingMore={this.state.loadingMore}
      chatIds={this.props.chatIds}
      resolveChat={this.resolveChat}
      editingText={this.state.editingText}
      setEditingText={this.setEditingText}
      submitEditingText={this.submitEditingText}
      loadMore={this.loadMore}
      back={this.props.routeToChatsRecent}
      leave={this.leave}
      invite={this.invite}
    />
  );

  me = this.context.uc.me();

  resolveBuddy = creator => {
    if (creator === this.me.id) return this.me;

    const { ucUserById } = this.props;
    return ucUserById[creator] || {};
  };

  resolveChat = (id, index) => {
    const { chatIds, chatById } = this.props;
    const chat = chatById[id];
    const prev = chatById[chatIds[index - 1]] || {};
    const mini = isMiniChat(chat, prev);

    const created = formatTime(chat.creator);
    const text = chat.text;

    if (mini) {
      return { mini: true, created, text };
    }

    const creator = this.resolveBuddy(chat.creator);

    return {
      creatorName: creator.name,
      creatorAvatar: creator.avatar,
      text,
      created,
    };
  };

  loadRecent() {
    const { group } = this.props;
    const { uc } = this.context;
    const max = numberOfChatsPerLoad;
    const query = { max };

    uc
      .getGroupChats(group.id, query)
      .then(this.onLoadRecentSuccess)
      .catch(this.onLoadRecentFailure);

    this.setState({ loadingRecent: true });
  }

  onLoadRecentSuccess = chats => {
    const { group, appendChats } = this.props;
    appendChats(group.id, chats.reverse());
    this.setState({ loadingRecent: false });
  };

  onLoadRecentFailure = err => {
    console.error(err);
    this.setState({ loadingRecent: false });
    const { showToast } = this.props;
    showToast('Failed to get recent chats');
  };

  loadMore = () => {
    const { group, chatIds, chatById } = this.props;
    const { uc } = this.context;
    const oldestChat = chatById[chatIds[0]] || {};
    const oldestCreated = oldestChat.created || 0;
    const max = numberOfChatsPerLoad;
    // fix server-side issue
    const end = oldestCreated - oldestCreated % 1000 - 1;
    const query = { max, end };

    uc
      .getGroupChats(group.id, query)
      .then(this.onLoadMoreSuccess)
      .catch(this.onLoadMoreFailure);

    this.setState({ loadingMore: true });
  };

  onLoadMoreSuccess = chats => {
    const { group, prependChats } = this.props;
    prependChats(group.id, chats.reverse());
    this.setState({ loadingMore: false });
  };

  onLoadMoreFailure = err => {
    const { showToast } = this.props;
    showToast('Failed to get more chats');
    console.error(err);
    this.setState({ loadingMore: false });
  };

  setEditingText = editingText => {
    this.setState({ editingText });
  };

  submitEditingText = () => {
    const { editingText } = this.state;
    if (!editingText.trim()) return;

    const { uc } = this.context;
    const { group } = this.props;

    uc
      .sendGroupChatText(group.id, editingText)
      .then(this.onSubmitEditingTextSuccess)
      .catch(this.onSubmitEditingTextFailure);
  };

  onSubmitEditingTextSuccess = chat => {
    const { appendChats, group } = this.props;
    appendChats(group.id, [chat]);
    this.setState({ editingText: '' });
  };

  onSubmitEditingTextFailure = err => {
    const { showToast } = this.props;
    showToast('Failed to send the message');
    console.error(err);
  };

  leave = () => {
    const { group } = this.props;
    const { uc } = this.context;

    uc
      .leaveChatGroup(group.id)
      .then(this.onLeaveSuccess)
      .catch(this.onLeaveFailure);
  };

  onLeaveSuccess = () => {
    const { group } = this.props;

    this.props.removeChatGroup(group.id);
    this.props.clearChatsByGroup(group.id);
    this.props.routeToChatsRecent();
  };

  onLeaveFailure = err => {
    const { showToast } = this.props;

    console.error(err);
    showToast('Failed to leave the group');
  };

  invite = () => {
    const groupId = this.props.group.id;
    this.props.routeToChatGroupInvite(groupId);
  };
}

export default createModelView(mapGetter, mapAction)(View);
