var express = require('express');
var router = express.Router();

router.get('/:target_id/submissions', function(req, res, next) {
  res.send(`Getting all submissions for target ${req.params.target_id}`);
});

router.post('/', function(req, res, next) {
  res.send(`Posting new target`);
})

router.delete('/:target_id', function(req, res, next) {
  res.send(`Deleted target ${req.params.target_id} and its associated submissions.`)
});

module.exports = router;
