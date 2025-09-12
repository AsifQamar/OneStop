
const express = require('express');
const {
  getAggregatedFares,
  getFareEstimate,
  bookRide,
  getRideStatus,
  cancelRide,
} = require('../controllers/rideController');


const router = express.Router();



router.get('/fare', getAggregatedFares);


router.get('/:provider/fare', getFareEstimate);

router.post('/:provider/book', bookRide);

router.get('/:provider/status/:id', getRideStatus);

router.delete('/:provider/cancel/:id', cancelRide);

module.exports = router;
