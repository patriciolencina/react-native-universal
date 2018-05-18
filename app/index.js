//@flow
import React from 'react';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider as StoreProvider } from 'react-redux';
import { Route, Redirect } from 'react-router-native';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import { createHashHistory, createMemoryHistory } from 'history';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react';

import reduces from './configs/reducers';
import './fix';
import ProfilesManage from './components/profiles-manage/index';
import ProfilesCreate from './components/profiles-create';
import ProfileUpdate from './components/profile-update';
import ProfileSignin from './components/profile-signin';

import Notifications from './components/notifications';
import ToastsNotify from './components/toasts-notify';
import StatusBar from './components/statusbar';

const persistedReducers = ['auth', 'feed'];
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
