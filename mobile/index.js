// Hermes lacks TextDecoder/TextEncoder, which react-native-executorch's
// SpeechToTextModule (Whisper tokenizer) needs. Polyfill before anything else.
import 'text-encoding-polyfill';

import {AppRegistry} from 'react-native';
import App from './src/app/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
