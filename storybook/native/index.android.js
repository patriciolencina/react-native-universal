import { AppRegistry, NativeModules, StatusBar } from 'react-native';
import { getStorybookUI, configure } from '@storybook/react-native';
import url from 'url';
import loadStories from '../loadStories';

import '../../app/fix/string-padstart';
import '../../app/fix/string-padend';

StatusBar.setHidden(true);

configure(loadStories, module);

const { hostname } = url.parse(NativeModules.SourceCode.scriptURL);
const StorybookUI = getStorybookUI({ port: 7001, host: hostname });
AppRegistry.registerComponent('react_native_web_universal', () => StorybookUI);
