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
  return contents.replace(versionRegex, `version: ${version}+1`);
};
