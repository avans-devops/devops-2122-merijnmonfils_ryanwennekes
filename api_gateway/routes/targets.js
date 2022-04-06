var express = require('express');
var router = express.Router();

router.get('/:target_id/submissions/:submission_id', function (req, res, next) {
  res.send('Viewing submission ' + req.params.submission_id + ' on target ' + req.params.target_id);
});

router.get(':target_id/submissions', function (req, res, next) {
  res.send('Viewing all submissions on target ' + req.params.target_id);
});

router.get('/', function (req, res, next) {
  res.send('Viewing all targets');
});

module.exports = router;
