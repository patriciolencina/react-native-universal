import React, { Component } from 'react';
import { createModelView } from '@thenewvu/redux-model';
import UI from './ui';

const mapGetter = getter => state => ({
  profileIds: getter.profiles.idsByOrder(state),
  profileById: getter.profiles.detailMapById(state),
});

const mapAction = action => emit => ({
  routeToProfilesCreate() {
    emit(action.router.goToProfilesCreate());
  },
  removeProfile(id) {
    emit(action.profiles.remove(id));
  },
  routeToProfileUpdate(id) {
    emit(action.router.goToProfileUpdate(id));
  },
  routeToProfileSignin(id) {
    emit(action.router.goToProfileSignin(id));
  },
});

class View extends Component {
  render = () => (
    <UI
      profileIds={this.props.profileIds}
      resolveProfile={this.resolveProfile}
      create={this.props.routeToProfilesCreate}
      update={this.props.routeToProfileUpdate}
      signin={this.props.routeToProfileSignin}
      remove={this.props.removeProfile}
    />
  );

  resolveProfile = id => this.props.profileById[id];
}

export default createModelView(mapGetter, mapAction)(View);
