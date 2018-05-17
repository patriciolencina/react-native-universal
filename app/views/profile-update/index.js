import React, { Component } from 'react';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => (state, props) => ({
  profile: getter.profiles.detailMapById(state)[props.match.params.profile],
});

const mapAction = action => emit => ({
  updateProfile(profile) {
    emit(action.profiles.update(profile));
  },
  routeToProfilesManage() {
    emit(action.router.goToProfilesManage());
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
});

class View extends Component {
  state = this.props.profile;

  render = () => (
    <UI
      profile={this.state}
      setPBXHostname={this.setPBXHostname}
      setPBXPort={this.setPBXPort}
      setPBXTenant={this.setPBXTenant}
      setPBXUsername={this.setPBXUsername}
      setPBXPassword={this.setPBXPassword}
      setAddingPark={this.setAddingPark}
      submitAddingPark={this.submitAddingPark}
      setUCEnabled={this.setUCEnabled}
      setUCHostname={this.setUCHostname}
      setUCPort={this.setUCPort}
      removePark={this.removePark}
      save={this.save}
      back={this.props.routeToProfilesManage}
    />
  );

  setPBXHostname = pbxHostname => {
    this.setState({ pbxHostname });
  };

  setPBXPort = pbxPort => {
    this.setState({ pbxPort });
  };

  setPBXTenant = pbxTenant => {
    this.setState({ pbxTenant });
  };

  setPBXUsername = pbxUsername => {
    this.setState({ pbxUsername });
  };

  setPBXPassword = pbxPassword => {
    this.setState({ pbxPassword });
  };

  setUCEnabled = ucEnabled => {
    this.setState({ ucEnabled });
  };

  setUCHostname = ucHostname => {
    this.setState({ ucHostname });
  };

  setUCPort = ucPort => {
    this.setState({ ucPort });
  };

  setAddingPark = addingPark => {
    this.setState({
      addingPark: addingPark.trim(),
    });
  };

  submitAddingPark = () => {
    const { addingPark, parks } = this.state;

    if (!addingPark) return;

    this.setState({
      parks: [addingPark, ...parks.filter(_ => _ !== addingPark)],
      addingPark: '',
    });
  };

  removePark = park => {
    this.setState(state => ({
      parks: state.parks.filter(_ => _ !== park),
    }));
  };

  missingRequired = () =>
    !this.state.pbxHostname ||
    !this.state.pbxPort ||
    !this.state.pbxUsername ||
    (this.state.ucEnabled && (!this.state.ucHostname || !this.state.ucPort));

  save = () => {
    if (this.missingRequired()) {
      this.props.showToast('Missing required fields');
      return;
    }

    this.props.updateProfile({
      id: this.state.id,
      pbxHostname: this.state.pbxHostname,
      pbxPort: this.state.pbxPort,
      pbxTenant: this.state.pbxTenant,
      pbxUsername: this.state.pbxUsername,
      pbxPassword: this.state.pbxPassword,
      parks: this.state.parks,
      ucEnabled: this.state.ucEnabled,
      ucHostname: this.state.ucHostname,
      ucPort: this.state.ucPort,
    });

    this.props.routeToProfilesManage();
  };
}

export default createModelView(mapGetter, mapAction)(View);
