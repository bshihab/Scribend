import {Platform} from 'react-native';

export const shadows = {
  glass: Platform.select({
    android: {elevation: 2},
    default: {
      shadowColor: '#000000',
      shadowOpacity: 0.07,
      shadowRadius: 18,
      shadowOffset: {width: 0, height: 10},
    },
  }),
  glow: Platform.select({
    android: {elevation: 3},
    default: {
      shadowColor: '#1F4B2D',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: {width: 0, height: 10},
    },
  }),
};
