import {Platform} from 'react-native';

export const shadows = {
  glass: Platform.select({
    android: {elevation: 3},
    default: {
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 8},
    },
  }),
  glow: Platform.select({
    android: {elevation: 5},
    default: {
      shadowColor: '#36F2D2',
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 8},
    },
  }),
};
