import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => state => ({
  pbxUserIds: getter.pbxUsers.idsByOrder(state),
  pbxUserById: getter.pbxUsers.detailMapById(state),
});

const mapAction = action => emit => ({
  routeToCallsManage() {
    emit(action.router.goToCallsManage());
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
});

class View extends Component {
  static contextTypes = {
    sip: PropTypes.object.isRequired,
  };

  static defaultProps = {
    pbxUserIds: [],
    pbxUserById: {},
  };

  state = {
    target: '',
    video: false,
  };

  render = () => (
    <UI
      target={this.state.target}
      matchIds={this.getMatchIds()}
      video={this.state.video}
      resolveMatch={this.resolveMatch}
      setTarget={this.setTarget}
      selectMatch={this.selectMatch}
      setVideo={this.setVideo}
      create={this.create}
      back={this.props.routeToCallsManage}
    />
  );

  setTarget = target => {
    this.setState({ target });
  };

  getMatchIds = () =>
    this.props.pbxUserIds.filter(id => id.includes(this.state.target));

  resolveMatch = id => {
    const match = this.props.pbxUserById[id];
    return {
      name: match.name,
      number: id,
      calling: !!match.callingTalkers.length,
      ringing: !!match.ringingTalkers.length,
      talking: !!match.talkingTalkers.length,
      holding: !!match.holdingTalkers.length,
    };
  };

  selectMatch = number => {
    this.setTarget(number);
  };

  setVideo = video => {
    this.setState({ video });
  };

  create = match => {
    const { target, video } = this.state;
    if (!target.trim()) {
      this.props.showToast('No target');
      return;
    }

    const { sip } = this.context;
    sip.createSession(target, {
      videoEnabled: video,
    });

    this.props.routeToCallsManage();
  };
}

export default createModelView(mapGetter, mapAction)(View);
