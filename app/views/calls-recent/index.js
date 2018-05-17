import React, { Component } from 'react';
import { createModelView } from '@thenewvu/redux-model';
import PropTypes from 'prop-types';
import UI from './ui';

const mapGetter = getter => state => ({
  callIds: getter.recentCalls.idsMapByProfile(state)[
    (getter.auth.profile(state) || {}).id
  ],
  callById: getter.recentCalls.detailMapById(state),
});

const mapAction = action => d => ({
  routeToCallsManage() {
    d(action.router.goToCallsManage());
  },
  removeCall(id) {
    d(action.recentCalls.remove(id));
  },
});

class View extends Component {
  static contextTypes = {
    sip: PropTypes.object.isRequired,
  };

  static defaultProps = {
    callIds: [],
    callById: {},
  };

  render = () => (
    <UI
      callIds={this.props.callIds}
      resolveCall={this.resolveCall}
      removeCall={this.props.removeCall}
      callBack={this.callBack}
      back={this.props.routeToCallsManage}
    />
  );

  resolveCall = id => this.props.callById[id];

  callBack = id => {
    const { sip } = this.context;
    const { callById } = this.props;
    const call = callById[id] || {};
    const number = call.partyNumber;

    sip.createSession(number);
    this.props.routeToCallsManage();
  };
}

export default createModelView(mapGetter, mapAction)(View);
