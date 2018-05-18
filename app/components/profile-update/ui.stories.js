import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import UI from './ui';

storiesOf(UI.name, module)
  .add('normal', () => (
    <UI
      profile={{
        pbxHostname: 'herocrazy.work',
        pbxPort: '8443',
        pbxTenant: 'tn1',
        pbxUsername: '1001',
        parks: [12001, 12002, 12003],
      }}
      save={action('save')}
      back={action('back')}
    />
  ))
  .add('404', () => <UI back={action('back')} />);
