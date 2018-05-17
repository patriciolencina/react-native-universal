import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import createID from 'shortid';
import UI from './ui';

const mapGetter = getter => state => ({
  runningIds: getter.runningCalls.idsByOrder(state),
  runningById: getter.runningCalls.detailMapById(state),
  parkingIds: getter.parkingCalls.idsByOrder(state),
  selectedId: getter.callsManaging.selectedId(state),
});

const mapAction = action => emit => ({
  routeToCallsRecent() {
    emit(action.router.goToCallsRecent());
  },
  routeToCallsCreate() {
    emit(action.router.goToCallsCreate());
  },
  updateCall(call) {
    emit(action.runningCalls.update(call));
  },
  selectCall(call) {
    emit(action.callsManaging.setSelectedId(call.id));
  },
  showToast(message) {
    emit(action.toasts.create({ id: createID(), message }));
  },
  routeToCallTransferDial(call) {
    emit(action.router.goToCallTransferDial(call));
  },
  routeToCallTransferAttend(call) {
    emit(action.router.goToCallTransferAttend(call));
  },
  routeToCallKeypad(call) {
    emit(action.router.goToCallKeypad(call));
  },
  routeToCallPark(call) {
    emit(action.router.goToCallPark(call));
  },
});

class View extends Component {
  static contextTypes = {
    sip: PropTypes.object.isRequired,
    pbx: PropTypes.object.isRequired,
  };

  render = () => (
    <UI
      selectedId={this.props.selectedId}
      runningIds={this.props.runningIds}
      runningById={this.props.runningById}
      parkingIds={this.props.parkingIds}
      browseHistory={this.props.routeToCallsRecent}
      create={this.props.routeToCallsCreate}
      select={this.props.selectCall}
      hangup={this.hangup}
      answer={this.answer}
      hold={this.hold}
      unhold={this.unhold}
      startRecording={this.startRecording}
      stopRecording={this.stopRecording}
      transfer={this.transfer}
      dtmf={this.dtmf}
      unpark={this.unpark}
      park={this.park}
      enableVideo={this.enableVideo}
      disableVideo={this.disableVideo}
    />
  );

  hangup = () => {
    const { sip } = this.context;
    sip.hangupSession(this.props.selectedId);
  };

  answer = () => {
    const { sip } = this.context;
    sip.answerSession(this.props.selectedId);
  };

  hold = () => {
    const { pbx } = this.context;
    const call = this.props.runningById[this.props.selectedId];
    pbx
      .holdTalker(call.pbxTenant, call.pbxTalkerId)
      .then(this.onHoldSuccess, this.onHoldFailure);
  };

  onHoldSuccess = () => {
    this.props.updateCall({
      id: this.props.selectedId,
      holding: true,
    });
  };

  onHoldFailure = err => {
    console.error(err);
    this.props.showToast('Failed to hold the call');
  };

  unhold = () => {
    const { pbx } = this.context;
    const call = this.props.runningById[this.props.selectedId];
    pbx
      .unholdTalker(call.pbxTenant, call.pbxTalkerId)
      .then(this.onUnholdSuccess, this.onUnholdFailure);
  };

  onUnholdSuccess = () => {
    this.props.updateCall({
      id: this.props.selectedId,
      holding: false,
    });
  };

  onUnholdFailure = err => {
    console.error(err);
    this.props.showToast('Failed to unhold the call');
  };

  startRecording = () => {
    const { pbx } = this.context;
    const call = this.props.runningById[this.props.selectedId];
    pbx
      .startRecordingTalker(call.pbxTenant, call.pbxTalkerId)
      .then(this.onStartRecordingSuccess, this.onStartRecordingFailure);
  };

  onStartRecordingSuccess = () => {
    this.props.updateCall({
      id: this.props.selectedId,
      recording: true,
    });
  };

  onStartRecordingFailure = err => {
    console.error(err);
    this.props.showToast('Failed to start recording the call');
  };

  stopRecording = () => {
    const { pbx } = this.context;
    const call = this.props.runningById[this.props.selectedId];
    pbx
      .stopRecordingTalker(call.pbxTenant, call.pbxTalkerId)
      .then(this.onStopRecordingSuccess, this.onStopRecordingFailure);
  };

  onStopRecordingSuccess = () => {
    this.props.updateCall({
      id: this.props.selectedId,
      recording: false,
    });
  };

  onStopRecordingFailure = err => {
    console.error(err);
    this.props.showToast('Failed to stop recording the call');
  };

  transfer = () => {
    const call = this.props.runningById[this.props.selectedId];
    if (call.transfering) {
      this.props.routeToCallTransferAttend(call.id);
    } else {
      this.props.routeToCallTransferDial(call.id);
    }
  };

  dtmf = () => {
    const call = this.props.runningById[this.props.selectedId];
    this.props.routeToCallKeypad(call.id);
  };

  unpark = parkNumber => {
    const { sip } = this.context;
    sip.createSession(parkNumber);
  };

  park = () => {
    const call = this.props.runningById[this.props.selectedId];
    this.props.routeToCallPark(call.id);
  };

  enableVideo = () => {
    const { sip } = this.context;
    sip.enableVideo(this.props.selectedId);
  };

  disableVideo = () => {
    const { sip } = this.context;
    sip.disableVideo(this.props.selectedId);
  };
}

export default createModelView(mapGetter, mapAction)(View);
