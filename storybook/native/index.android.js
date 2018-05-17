import { AppRegistry, NativeModules, StatusBar } from 'react-native';
import { getStorybookUI, configure } from '@storybook/react-native';
import url from 'url';

import '../../app/fix/string-padstart';
import '../../app/fix/string-padend';

StatusBar.setHidden(true);

function loadStories() {
  require('../../app/views/chat-groups-notify/ui.stories.js');
  require('../../app/views/calls-recent/ui.stories.js');
  require('../../app/views/call-transfer-dial/ui.stories.js');
  require('../../app/views/uc-auth/ui.stories.js');
  require('../../app/views/settings/ui.stories.js');
  require('../../app/views/pbx-auth/ui.stories.js');
  require('../../app/views/phonebooks-browse/ui.stories.js');
  require('../../app/views/calls-create/ui.stories.js');
  require('../../app/views/chats-recent/ui.stories.js');
  require('../../app/views/call-transfer-attend/ui.stories.js');
  require('../../app/views/calls-manage/ui.stories.js');
  require('../../app/views/contacts-browse/ui.stories.js');
  require('../../app/views/group-chats-recent/ui.stories.js');
  require('../../app/views/profile-signin/ui.stories.js');
  require('../../app/views/contacts-create/ui.stories.js');
  require('../../app/views/tabbar/ui.stories.js');
  require('../../app/views/call-videos/ui.stories.js');
  require('../../app/views/toasts-notify/ui.stories.js');
  require('../../app/views/profiles-create/ui.stories.js');
  require('../../app/views/users-browse/ui.stories.js');
  require('../../app/views/call-park/ui.stories.js');
  require('../../app/views/call-keypad/ui.stories.js');
  require('../../app/views/sip-auth/ui.stories.js');
  require('../../app/views/profile-update/ui.stories.js');
  require('../../app/views/chat-group-invite/ui.stories.js');
  require('../../app/views/chat-groups-create/ui.stories.js');
  require('../../app/views/calls-notify/ui.stories.js');
  require('../../app/views/profiles-manage/ui.stories.js');
  require('../../app/views/buddy-chats-recent/ui.stories.js');
}

configure(loadStories, module);

const { hostname } = url.parse(NativeModules.SourceCode.scriptURL);
const StorybookUI = getStorybookUI({ port: 7001, host: hostname });
AppRegistry.registerComponent('react_native_web_universal', () => StorybookUI);
