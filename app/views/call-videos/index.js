import React, { Component } from 'react';
import { createModelView } from '@thenewvu/redux-model';
import UI from './ui';

const mapGetter = getter => state => ({
  callIds: getter.runningCalls.idsByOrder(state),
  callById: getter.runningCalls.detailMapById(state),
});

class View extends Component {
  render = () => (
    <UI callIds={this.props.callIds} resolveCall={this.resolveCall} />
  );

  resolveCall = id => {
    const call = this.props.callById[id];
    return {
      enabled: call.localVideoEnabled,
      source: call.remoteVideoStreamURL,
    };
  };
}

export default createModelView(mapGetter, null)(View);
