import React, { Component } from 'react';
import { createModelView } from '@thenewvu/redux-model';
import UI from './ui';

const mapGetter = getter => state => ({
  chatsEnabled: (getter.auth.profile(state) || {}).ucEnabled,
});

const mapAction = action => emit => ({
  routeToCallsManage() {
    emit(action.router.goToCallsManage());
  },
  routeToSettings() {
    emit(action.router.goToSettings());
  },
  routeToUsersBrowse() {
    emit(action.router.goToUsersBrowse());
  },
  routeToRecentChats() {
    emit(action.router.goToChatsRecent());
  },
  routeToPhonebooks() {
    emit(action.router.goToPhonebooksBrowse());
  },
});

class View extends Component {
  render = () => (
    <UI
      chatsEnabled={this.props.chatsEnabled}
      pressCalls={this.props.routeToCallsManage}
      pressSettings={this.props.routeToSettings}
      pressUsers={this.props.routeToUsersBrowse}
      pressChats={this.props.routeToRecentChats}
      pressBooks={this.props.routeToPhonebooks}
    />
  );
}

export default createModelView(mapGetter, mapAction)(View);
