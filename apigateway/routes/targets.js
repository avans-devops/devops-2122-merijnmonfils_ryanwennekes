var express = require('express');
const axios = require('axios');
var router = express.Router();

// Circuit breaker
const circuitBreaker = require('opossum');
const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
}
const breaker = new circuitBreaker(callService, options);

breaker.fallback(() => "De service kon niet bereikt worden.");
breaker.on("fallback", (result) => {
  console.log(result);
});

async function callService(httpMethod, service, port, resource) {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`
    })
    .then(function(response) {
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
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

router.get('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("get", "hostingservice", 3001, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

router.get('/', function (req, res, next) {
  breaker
    .fire("get", "participationservice", 3002, "/targets")
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

// Post routes
router.post('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("post", "participationservice", 3002, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

router.post('/', function (req, res, next) {
  breaker
    .fire("post", "hostingservice", 3001, `/targets`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
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
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
})

router.delete('/:target_id', function(req, res, next) {
  breaker
    .fire("delete", "hostingservice", 3001, `/targets/${req.params.target_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
})

module.exports = router;
