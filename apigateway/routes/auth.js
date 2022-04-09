const express = require('express');
const router = express.Router();
const axios = require('axios');
const circuitBreaker = require('opossum');
const options = {
  timeout: 10000,
  errorThresholdPercentage: 100,
  resetTimeout: 1
}
const breaker = new circuitBreaker(callService, options);

async function callService(httpMethod, service, port, resource, data = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
      headers: {
        'Content-Type': contentType
      },
      validateStatus: false
    })
    .then(function(response) {
      if (!(response.status >= 100 && response.status < 400)) {
        reject(response);
      }

      resolve(response);
    })
    .catch(function(error) {
      reject(error);
    });
  });
};

router.post('/signup', function (req, res, next) {
  breaker
    .fire("post", "authenticationservice", process.env.AUTH_PORT, `/signup`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/login', function (req, res, next) {
  breaker
    .fire("post", "authenticationservice", process.env.AUTH_PORT, `/login`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = router;