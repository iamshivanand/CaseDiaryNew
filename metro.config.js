const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude E2E test results, HTML fixtures, Playwright reports, and Android build output from Metro file watcher
config.resolver.blockList = [
  /[/\\]test-results[/\\].*/,
  /[/\\]playwright-report[/\\].*/,
  /[/\\]utils[/\\]e2e[/\\]fixtures[/\\].*/,
  /[/\\]android[/\\]app[/\\]build[/\\].*/,
];

module.exports = config;
