const config = {
  verbose: true,
  "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ],
    "preset": "@shelf/jest-mongodb",
    "coverageThreshold": {
      "global": {
        "lines": 60
      }
    }
};

module.exports = config;