import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => state => {
  const profile = getter.auth.profile(state);

  if (!profile) {
    return { retryable: false, failure: true };
  }

  return {
    retryable: true,
    pbxSuccess: getter.auth.pbx.success(state),
    pbxHostname: profile.pbxHostname,
    pbxTenant: profile.pbxTenant,
    pbxUsername: profile.pbxUsername,
    started: getter.auth.sip.started(state),
    stopped: getter.auth.sip.stopped(state),
    success: getter.auth.sip.success(state),
    failure: getter.auth.sip.failure(state),
  };
};

const mapAction = action => emit => ({
  onStarted() {
    emit(action.auth.sip.onStarted());
  },
  onFailure() {
    emit(action.auth.sip.onFailure());
  },
  onStopped() {
    emit(action.auth.sip.onStopped());
  },
  routeToProfilesManage() {
    emit(action.router.goToProfilesManage());
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
});

class View extends Component {
  static contextTypes = {
    pbx: PropTypes.object.isRequired,
    sip: PropTypes.object.isRequired,
  };

  render = () =>
    this.props.success ? null : (
      <UI
        retryable={this.props.retryable}
        failure={this.props.failure}
        abort={this.props.routeToProfilesManage}
        retry={this.retry}
      />
    );

  componentDidMount() {
    if (this.needToAuth()) {
      this.auth().catch(this.onAuthFailure);
    }
  }

  componentDidUpdate() {
    if (this.needToAuth()) {
      this.auth().catch(this.onAuthFailure);
    }
  }

  componentWillUnmount() {
    this.props.onStopped();
    this.context.sip.disconnect();
  }

  needToAuth() {
    return (
      this.props.pbxSuccess &&
      (!this.props.started && !this.props.success && !this.props.failure)
    );
  }

  async auth() {
    const { pbx, sip } = this.context;

    sip.disconnect();
    this.props.onStarted();

    const pbxConfig = await pbx.getConfig();
    if (!pbxConfig) {
      throw new Error('Invalid PBX config');
    }

    const sipWSSPort = pbxConfig['sip.wss.port'];
    if (!sipWSSPort) {
      throw new Error('Invalid SIP WSS port');
    }

    const pbxUserConfig = await pbx.getUser(
      this.props.pbxTenant,
      this.props.pbxUsername,
    );
    if (!pbxUserConfig) {
      throw new Error('Invalid PBX user config');
    }

    const userPhones = pbxUserConfig.phones;
    const isWebPhone = phone =>
      !!phone.id &&
      (phone.type === 'Web Phone' ||
        phone.type === 'webrtc' ||
        phone.type === 'WebRTCs');
    const webPhone = userPhones.find(isWebPhone);
    if (!webPhone) {
      throw new Error('Not found WebRTC phone');
    }

    const sipAccessToken = await pbx.createSIPAccessToken(webPhone.id);
    if (!sipAccessToken) {
      throw new Error('Invalid SIP access token');
    }

    sip.connect({
      hostname: this.props.pbxHostname,
      port: sipWSSPort,
      tenant: this.props.pbxTenant,
      username: webPhone.id,
      accessToken: sipAccessToken,
    });
  }

  onAuthFailure = err => {
    console.error(err);
    if (err && err.message) {
      this.props.showToast(err.message);
    }
    this.props.onFailure();
  };

  retry = () => {
    this.auth().catch(this.onAuthFailure);
  };
}

export default createModelView(mapGetter, mapAction)(View);
