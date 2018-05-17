import React from 'react';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider as StoreProvider } from 'react-redux';
import { Route, Redirect } from 'react-router-native';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import { createHashHistory, createMemoryHistory } from 'history';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react';

import './fix';
import ProfilesManage from './views/profiles-manage/index';
import ProfilesCreate from './views/profiles-create';
import ProfileUpdate from './views/profile-update';
import ProfileSignin from './views/profile-signin';

import Notifications from './views/notifications';
import ToastsNotify from './views/toasts-notify';
import StatusBar from './views/statusbar';

import app from './views/profiles-manage/reducer';
import board from './views/profiles-create/reducer';
import home from './views/profile-update/reducer';
import auth from './views/profile-signin/reducer';

const reduces = combineReducers({
  app,
  board,
  home,
  auth,
});

const persistedReducers = ['app', 'board'];
const persistConfig = {
  key: 'react_native_web_universal',
  storage,
  whitelist: persistedReducers,
  version: '3.0.0',
};

const storeReducer = persistReducer(persistConfig, reduces);

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
    <Notifications>
      <ToastsNotify />
    </Notifications>
  </View>
);

const App = () => (
  <StoreProvider store={store}>
    <PersistGate persistor={storePersistor} loading={<Loading />}>
      <ConnectedRouter history={routerHistory}>
        <Routing />
      </ConnectedRouter>
    </PersistGate>
  </StoreProvider>
);

export default App;
