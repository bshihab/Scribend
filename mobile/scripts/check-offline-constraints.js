const fs = require('fs');
const path = require('path');

const forbidden = [
  'firebase',
  '@react-native-firebase',
  'analytics',
  'amplitude',
  'segment',
  'openai',
  'axios',
  'graphql',
  'apollo',
];

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const violations = Object.keys(dependencies).filter(name =>
  forbidden.some(term => name.toLowerCase().includes(term)),
);

if (violations.length > 0) {
  console.error(`Forbidden cloud/analytics dependencies found: ${violations.join(', ')}`);
  process.exit(1);
}

console.log('Offline constraints check passed.');
