var express = require('express');
var router = express.Router();

// Axios
const axios = require('axios');

// Circuit breaker
const circuitBreaker = require('opossum');
const options = {
  timeout: 10000,
  errorThresholdPercentage: 100,
  resetTimeout: 1
}
const breaker = new circuitBreaker(callService, options);

async function callService(jwt, httpMethod, service, port, resource, data = {}, queryParams = {}) {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
      headers: {
        'Authorization': jwt
      },
      params: queryParams,
      validateStatus: false
    })
    .then(function(response) {
      if (!(response.status >= 100 && response.status < 400)) {
        reject(response);
      }

      resolve(response);
    })
    .catch(function(error) {
      console.log(JSON.stringify(error));
      reject(error);
    });
  });
};

router.get('/:submission_id', async (req, res, next) => {
  breaker
    .fire(req.headers.authorization, "get", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/', async (req, res, next) => {
  breaker
    .fire(req.headers.authorization, "get", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/submissions`, {}, req.query)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.put('/:submission_id', async (req, res, next) => {
  breaker
    .fire(req.headers.authorization, "put", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/submissions/${req.params.submission_id}`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.delete('/:submission_id', async (req, res, next) => {
  breaker
    .fire(req.headers.authorization, "delete", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = router;