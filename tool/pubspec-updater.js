// Custom standard-version updater for pubspec.yaml
// Reads/writes the `version: x.y.z+1` line.

const versionRegex = /^version:\s*(\S+)/m;

module.exports.readVersion = function (contents) {
  const match = contents.match(versionRegex);
  if (!match) throw new Error('Could not find version in pubspec.yaml');
  // Strip the +build suffix for standard-version
  return match[1].replace(/\+.*$/, '');
};

module.exports.writeVersion = function (contents, version) {
  // Encode semver as a monotonically-increasing integer so Android versionCode
  // never repeats: 2.0.10 → 20010, 2.1.0 → 20100, 3.0.0 → 30000.
  const [major, minor, patch] = version.split('.').map(Number);
  const buildNumber = major * 10000 + minor * 100 + patch;
  return contents.replace(versionRegex, `version: ${version}+${buildNumber}`);
};
