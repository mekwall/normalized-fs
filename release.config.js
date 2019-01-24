module.exports = {
  branches: [
    'release',
    {
      name: 'beta',
      prerelease: true,
      channel: 'beta',
    },
    {
      name: 'alpha',
      prerelease: true,
      channel: 'alpha',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git',
  ],
};
