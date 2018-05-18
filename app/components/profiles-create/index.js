import React from 'react';

import UI from './ui';

export default () => (
  <UI
    pbxHostname="herocrazy.work"
    pbxPort="8443"
    pbxTenant="tn1"
    pbxUsername="1001"
    ucEnabled={true}
    parks={[12001, 12002, 12003]}
  />
);
