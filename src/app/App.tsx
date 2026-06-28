import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ScribendNavigator} from '../navigation/ScribendNavigator';
import {PatientStoreProvider} from '../store/PatientStore';
import {VisitStoreProvider} from '../store/VisitStore';
import {colors} from '../theme/colors';

const App = () => (
  <SafeAreaProvider>
    <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
    <PatientStoreProvider>
      <VisitStoreProvider>
        <ScribendNavigator />
      </VisitStoreProvider>
    </PatientStoreProvider>
  </SafeAreaProvider>
);

export default App;
