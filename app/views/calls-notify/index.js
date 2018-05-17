import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createModelView } from '@thenewvu/redux-model';
import UI from './ui';

const isIncoming = call => call.incoming && !call.answered;

const mapGetter = getter => state => ({
  callIds: getter.runningCalls
    .idsByOrder(state)
    .filter(id => isIncoming(getter.runningCalls.detailMapById(state)[id])),
  callById: getter.runningCalls.detailMapById(state),
});

class View extends Component {
  static contextTypes = {
    sip: PropTypes.object.isRequired,
  };

  render = () => (
    <UI
      callIds={this.props.callIds}
      resolveCall={this.resolveCall}
      accept={this.accept}
      reject={this.reject}
    />
  );

  resolveCall = id => this.props.callById[id];

  reject = id => {
    const { sip } = this.context;
    sip.hangupSession(id);
  };

  accept = id => {
    const { sip } = this.context;
    const call = this.props.callById[id];
    const videoEnabled = call.remoteVideoEnabled;
    sip.answerSession(id, { videoEnabled });
  };
}

export default createModelView(mapGetter)(View);
