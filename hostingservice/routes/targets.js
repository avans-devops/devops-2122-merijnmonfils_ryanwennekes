var express = require('express');
var router = express.Router();
require('../services/connection');
var targetModel = require('../models/target');
require('../models/submission');

router.get('/:target_id/submissions', async function(req, res, next) {
  var targetID = req.params.target_id;

  try {
    var result = await targetModel.findById(targetID).populate('submissions');
    
    if (result != null)
    {
      res.status(200).send(result)
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
    res.send(target);
  } catch (error) {
    if (error.name === "ValidationError") {
      let errors = {};

      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      res.status(400).send(errors);
    }

    res.status(500).send("Something went wrong");
  }
})

router.delete('/:target_id', async function(req, res, next) {
  var targetId = req.params.target_id;

  try {
    var result = await targetModel.deleteOne({_id: req.params.target_id})

    if (result.deletedCount != 0) {
      res.status(200).send("Target deleted");
    }

    const notFoundError = new Error(`Target with ID ${targetId} does not exist.`);
    notFoundError.status = 404;

    throw notFoundError;
  } catch (error) {
    next(error);
  }
});

module.exports = router;
