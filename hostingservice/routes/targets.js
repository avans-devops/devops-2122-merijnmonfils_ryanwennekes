require('dotenv');
var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
require('../services/mongo');
var rabbitmq = require('../services/rabbitmq');
var targetModel = require('../models/target');
var submissionModel = require('../models/submission');
const participationServiceQueue = 'participation-service-updater';
const cloudinary = require('cloudinary').v2;

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

router.post('/', upload.single('image'), async function(req, res, next) {
  const target = new targetModel(req.body);

  console.log(JSON.stringify(req.file));
  res.send("ok");

  // try {
  //   await target.save();

  //   await rabbitmq.sendToQueue(participationServiceQueue, JSON.stringify({ // Zorg ervoor dat de participationServiceQueue de update ook krijgt, maar alleen wanneer deze bereikbaar is (i.e., message bus).
  //     method: "post",
  //     model: "target",
  //     data: target
  //   }));
  //   return res.status(200).send(target);
  // } catch (error) {
  //   next(error);
  // }
})

router.delete('/:target_id', async function(req, res, next) {
  var targetId = req.params.target_id;

  try {
    var target = await targetModel.findById(targetId);

    if (target != null)
    {
      await targetModel.deleteOne({_id: target._id});
      await submissionModel.deleteMany({_id: {$in: target.submissions}})
      
      await rabbitmq.sendToQueue(participationServiceQueue, JSON.stringify({ 
        method: "delete",
        model: "target",
        data: [target]
      }));

      await rabbitmq.sendToQueue(participationServiceQueue, JSON.stringify({ 
        method: "delete",
        model: "submission",
        data: target.submissions
      }));

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
