const express = require('express');
const morgan = require('morgan');
const rideRoutes = require('./routes/rideRoutes');
const errorHandler = require('./middilewares/errorHandler');

const app = express();

app.use(express.json());

app.use(morgan('dev'));

app.use('/api/v1/ride', rideRoutes);

app.use(errorHandler);

module.exports = app;
