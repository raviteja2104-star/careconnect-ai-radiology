const { withProjectBuildGradle } = require('@expo/config-plugins');

// Directly patches android/build.gradle during prebuild to force Kotlin 1.9.25.
// Needed because expo-modules-core uses Compose Compiler 1.5.15 which requires 1.9.25,
// but EAS build environment defaults to 1.9.24.
module.exports = function withKotlinVersion(config, { version = '1.9.25' } = {}) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('kotlinVersion')) {
      // Replace existing kotlinVersion value
      contents = contents.replace(
        /kotlinVersion\s*=\s*['"][^'"]*['"]/g,
        `kotlinVersion = "${version}"`
      );
    } else {
      // Inject into buildscript ext block
      contents = contents.replace(
        /(buildscript\s*\{[\s\S]*?ext\s*\{)/,
        `$1\n        kotlinVersion = "${version}"`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
