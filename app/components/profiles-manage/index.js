import React from 'react';
import faker from 'faker';
import UI from './ui';

export default () => (
  <UI
    profileIds={Array.from(profiles, (_, i) => i)}
    resolveProfile={id => profiles[id]}
  />
);

const profiles = [
  {
    pbxHostname: faker.internet.domainName(),
    pbxPort: faker.random.number(),
    pbxTenant: faker.address.stateAbbr(),
    pbxUsername: '1001',
  },
  {
    pbxHostname: faker.internet.domainName(),
    pbxPort: faker.random.number(),
    pbxTenant: faker.address.stateAbbr(),
    pbxUsername: '1002',
  },
  {
    pbxHostname: faker.internet.domainName(),
    pbxPort: faker.random.number(),
    pbxTenant: faker.address.stateAbbr(),
    pbxUsername: '1002',
  },
];
