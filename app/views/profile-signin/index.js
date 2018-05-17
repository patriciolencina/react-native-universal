import React from 'react';

import UI from './ui';

export default () => (
  <UI
    profile={{
      pbxHostname: 'herocrazy.work',
      pbxPort: '8443',
      pbxTenant: 'tn1',
      pbxUsername: '1001',
    }}
    pbxPassword="123"
    setPbxPassword={() => {}}
    cancel={() => {}}
    signin={() => {}}
  />
);
