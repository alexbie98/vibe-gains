module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Customize rules as needed
    'type-enum': [
      2,
      'always',
      [
        'feat',     // A new feature
        'fix',      // A bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'test',     // Adding missing tests or correcting existing tests
        'chore',    // Changes to the build process or auxiliary tools
        'perf',     // A code change that improves performance
        'ci',       // Changes to CI configuration files and scripts
        'build',    // Changes that affect the build system or external dependencies
        'revert'    // Reverts a previous commit
      ]
    ],
    'subject-case': [2, 'always', ['sentence-case', 'lower-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 150],
    'footer-max-line-length': [2, 'always', 150]
  }
};