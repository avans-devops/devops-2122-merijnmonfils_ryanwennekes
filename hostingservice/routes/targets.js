var express = require('express');
var router = express.Router();
require('../services/connection');
var targetModel = require('../models/target');
var submissionModel = require('../models/submission');

router.get('/:target_id/submissions', async function(req, res, next) {
  var targetID = req.params.target_id;

  try {
    var result = await targetModel.findById(targetID).populate('submissions').select('submissions -_id');
    
    if (result != null)
    {
      res.status(200).send(result.submissions)
    } else {
      const notFoundError = new Error(`Target with ID ${targetID} does not exist.`);
      notFoundError.status = 404;

      throw notFoundError;
    }
  }
  catch(error) {
    next(error);
  }
});

router.post('/', async function(req, res, next) {
  const target = new targetModel(req.body);

  try {
    await target.save();

    return res.send(target);
  } catch (error) {
    next(error);
  }
})

router.delete('/:target_id', async function(req, res, next) {
  var targetId = req.params.target_id;

  try {
    var target = await targetModel.findById(targetId);

    if (target != null)
    {
      await targetModel.deleteOne({_id: target._id});
      await submissionModel.deleteMany({_id: {$in: target.submissions}})

      return res.status(200).send(`Target with ID ${targetId} and its submissions have been successfully removed`);
    }

    const notFoundError = new Error(`Target with ID ${targetId} does not exist.`);
    notFoundError.status = 404;

    throw notFoundError;
  } catch (error) {
    next(error);
  }
});

module.exports = router;
