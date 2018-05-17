import React from 'react';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider as StoreProvider } from 'react-redux';
import { ModelProvider, combineModels } from '@thenewvu/redux-model';
import { Route, Redirect } from 'react-router-native';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import { createHashHistory, createMemoryHistory } from 'history';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react';

import './fix';
import ProfilesManage from './views/profiles-manage';
import ProfilesCreate from './views/profiles-create';
import ProfileUpdate from './views/profile-update';
import ProfileSignin from './views/profile-signin';
import UsersBrowse from './views/users-browse';
import CallsManage from './views/calls-manage';
import CallsCreate from './views/calls-create';
import CallsRecent from './views/calls-recent';
import CallsNotify from './views/calls-notify';
import CallVoices from './views/call-voices';
import CallVideos from './views/call-videos';
import CallTransferDial from './views/call-transfer-dial';
import CallTransferAttend from './views/call-transfer-attend';
import CallKeypad from './views/call-keypad';
import CallPark from './views/call-park';
import ChatsRecent from './views/chats-recent';
import BuddyChatsRecent from './views/buddy-chats-recent';
import GroupChatsRecent from './views/group-chats-recent';
import ChatGroupsCreate from './views/chat-groups-create';
import ChatGroupsNotify from './views/chat-groups-notify';
import ChatGroupInvite from './views/chat-group-invite';
import PhonebooksBrowse from './views/phonebooks-browse';
import ContactsBrowse from './views/contacts-browse';
import ContactsCreate from './views/contacts-create';
import Tabbar from './views/tabbar';
import Settings from './views/settings';
import PBXAuth from './views/pbx-auth';
import SIPAuth from './views/sip-auth';
import UCAuth from './views/uc-auth';
import Notifications from './views/notifications';
import ToastsNotify from './views/toasts-notify';
import APIProvider from './apis';
import StatusBar from './views/statusbar';
import * as models from './models';

const { getter, action, reduce } = combineModels(models);

const persistedReducers = ['profiles', 'recentCalls'];
const persistConfig = {
  key: 'brekeke-phone',
  storage,
  whitelist: persistedReducers,
  version: '3.0.0',
};
const storeReducer = persistReducer(persistConfig, reduce);

const routerHistory =
  Platform.OS === 'web' ? createHashHistory() : createMemoryHistory();
const router = routerMiddleware(routerHistory);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const storeEnhancer = composeEnhancers(applyMiddleware(router));

const store = createStore(storeReducer, storeEnhancer);
const storePersistor = persistStore(store);

const Loading = () => (
  <View style={StyleSheet.absoluteFill}>
    <ActivityIndicator />
  </View>
);

const Routing = () => (
  <View style={StyleSheet.absoluteFill}>
    <StatusBar />
    <Route exact path="/" render={() => <Redirect to="/profiles/manage" />} />
    <Route exact path="/profiles/manage" component={ProfilesManage} />
    <Route exact path="/profiles/create" component={ProfilesCreate} />
    <Route exact path="/profile/:profile/update" component={ProfileUpdate} />
    <Route exact path="/profile/:profile/signin" component={ProfileSignin} />
    <Route exact path="/auth" render={() => <Redirect to="/auth/users" />} />
    <Route exact path="/auth/calls/manage" component={CallsManage} />
    <Route exact path="/auth/calls/create" component={CallsCreate} />
    <Route exact path="/auth/calls/recent" component={CallsRecent} />
    <Route
      exact
      path="/auth/call/:call/transfer/dial"
      component={CallTransferDial}
    />
    <Route
      exact
      path="/auth/call/:call/transfer/attend"
      component={CallTransferAttend}
    />
    <Route exact path="/auth/call/:call/keypad" component={CallKeypad} />
    <Route exact path="/auth/call/:call/park" component={CallPark} />
    <Route exact path="/auth/users" component={UsersBrowse} />
    <Route
      exact
      path="/auth/chats/buddy/:buddy/recent"
      component={BuddyChatsRecent}
    />
    <Route
      exact
      path="/auth/chats/group/:group/recent"
      component={GroupChatsRecent}
    />
    <Route exact path="/auth/chat-groups/create" component={ChatGroupsCreate} />
    <Route
      exact
      path="/auth/chat-group/:group/invite"
      component={ChatGroupInvite}
    />
    <Route exact path="/auth/chats/recent" component={ChatsRecent} />
    <Route exact path="/auth/settings" component={Settings} />
    <Route exact path="/auth/phonebooks/browse" component={PhonebooksBrowse} />
    <Route exact path="/auth/contacts/browse" component={ContactsBrowse} />
    <Route exact path="/auth/contacts/create" component={ContactsCreate} />
    <Route path="/auth" component={CallVoices} />
    <Route path="/auth" component={Tabbar} />
    <Route path="/auth" component={CallVideos} />
    <Route path="/auth" component={SIPAuth} />
    <Route path="/auth" component={UCAuth} />
    <Route path="/auth" component={PBXAuth} />
    <Notifications>
      <Route path="/auth" component={CallsNotify} />
      <Route path="/auth" component={ChatGroupsNotify} />
      <ToastsNotify />
    </Notifications>
  </View>
);

const App = () => (
  <StoreProvider store={store}>
    <PersistGate persistor={storePersistor} loading={<Loading />}>
      <ModelProvider getter={getter} action={action}>
        <APIProvider>
          <ConnectedRouter history={routerHistory}>
            <Routing />
          </ConnectedRouter>
        </APIProvider>
      </ModelProvider>
    </PersistGate>
  </StoreProvider>
);

export default App;
