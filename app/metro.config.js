const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom asset extensions for TFLite models and SQLite databases
config.resolver.assetExts.push('tflite', 'db', 'bin');

module.exports = config;
