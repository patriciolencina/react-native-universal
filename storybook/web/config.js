import { configure } from '@storybook/react-native';
import '../../web/index.css';
import loadStories from '../loadStories';

configure(loadStories, module);
