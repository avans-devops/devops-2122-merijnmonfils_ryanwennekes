const config = {
  verbose: true,
  'coveragePathIgnorePatterns': [
    '/node_modules/'
  ],
  'preset': '@shelf/jest-mongodb',
  'coverageThreshold': {
    'global': {
      'lines': 60
    }
  }
};

module.exports = config;