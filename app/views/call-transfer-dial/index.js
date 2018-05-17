import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => (state, props) => ({
  call: getter.runningCalls.detailMapById(state)[props.match.params.call],
  pbxUserIds: getter.pbxUsers.idsByOrder(state),
  pbxUserById: getter.pbxUsers.detailMapById(state),
});

const mapAction = action => emit => ({
  routeToCallsManage() {
    emit(action.router.goToCallsManage());
  },
  routeToCallTransferAttend(call) {
    emit(action.router.goToCallTransferAttend(call));
  },
  updateCall(call) {
    emit(action.runningCalls.update(call));
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
});

class View extends Component {
  static contextTypes = {
    pbx: PropTypes.object.isRequired,
  };

  static defaultProps = {
    pbxUserIds: [],
    pbxUserById: {},
  };

  state = {
    attended: true,
    target: '',
  };

  render = () => (
    <UI
      call={this.props.call}
      attended={this.state.attended}
      target={this.state.target}
      matchIds={this.getMatchIds()}
      resolveMatch={this.resolveMatch}
      selectMatch={this.selectMatch}
      setAttended={this.setAttended}
      setTarget={this.setTarget}
      transfer={this.transfer}
      back={this.props.routeToCallsManage}
    />
  );

  setAttended = attended => {
    this.setState({ attended });
  };

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

  transfer = () => {
    const { pbx } = this.context;
    const { attended } = this.state;
    const promise = attended
      ? pbx.transferTalkerAttended(
          this.props.call.pbxTenant,
          this.props.call.pbxTalkerId,
          this.state.target,
        )
      : pbx.transferTalkerBlind(
          this.props.call.pbxTenant,
          this.props.call.pbxTalkerId,
          this.state.target,
        );

    promise.then(this.onTransferSuccess, this.onTransferFailure);
  };

  onTransferSuccess = () => {
    const { call } = this.props;
    const { attended, target } = this.state;
    if (!attended) return this.props.routeToCallsManage();

    this.props.updateCall({ id: call.id, transfering: target });
    this.props.routeToCallTransferAttend(call.id);
  };

  onTransferFailure = err => {
    console.error(err);
    this.props.showToast('Failed target transfer the call');
  };
}

export default createModelView(mapGetter, mapAction)(View);
