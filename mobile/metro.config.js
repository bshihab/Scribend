// Expo-integrated app: use Expo's metro config so the `export:embed` bundler's
// serializer matches (executorch pulls in expo, which drives bundling).
const {getDefaultConfig} = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
