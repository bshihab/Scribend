// TEMPORARY: exclude react-native-audio-api from Android autolinking.
// Reason: v0.6.5 fails to compile with NDK 28 (std::char_traits<unsigned char>
// undefined-template error). It's only needed to decode audio for Whisper, so
// we defer it and keep react-native-executorch (the Llama runtime) enabled.
//
// To re-enable: pin a NDK-28-compatible react-native-audio-api version, then
// remove this file. See mobile/AI_INTEGRATION.md.
module.exports = {
  dependencies: {
    'react-native-audio-api': { platforms: { android: null } },
  },
};
