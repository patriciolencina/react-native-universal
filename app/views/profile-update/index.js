import React from 'react';

import UI from './ui';

export default () => (
  <UI
    profile={{
      pbxHostname: 'herocrazy.work',
      pbxPort: '8443',
      pbxTenant: 'tn1',
      pbxUsername: '1001',
      parks: [12001, 12002, 12003],
    }}
  />
);
