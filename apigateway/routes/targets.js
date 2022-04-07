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

async function callService(httpMethod, service, port, resource, data = null) {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
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

router.get('/:target_id/submissions/:submission_id', function (req, res, next) {
  breaker
    .fire("get", "participationservice", 3002, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("get", "hostingservice", 3001, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/', function (req, res, next) {
  breaker
    .fire("get", "participationservice", 3002, "/targets")
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

// Post routes
router.post('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("post", "participationservice", 3002, `/targets/${req.params.target_id}/submissions`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/', function (req, res, next) {
  breaker
    .fire("post", "hostingservice", 3001, `/targets`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

// Delete routes
router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  breaker
    .fire("delete", "participationservice", 3002, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

router.delete('/:target_id', function(req, res, next) {
  breaker
    .fire("delete", "hostingservice", 3001, `/targets/${req.params.target_id}`)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      next(error);
    });
})

module.exports = router;
