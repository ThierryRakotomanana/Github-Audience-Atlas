export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'build',    // build system / tooling
        'chore',    // maintenance
        'ci',       // CI configuration
        'docs',     // documentation only
        'perf',     // performance improvement
        'refactor', // code change with no fix or feature
        'revert',   // revert a previous commit
        'style',    // formatting, no logic change
        'test',     // adding or fixing tests
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
}