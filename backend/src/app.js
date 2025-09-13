// app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); // <-- 1. Import CORS
const errorHandler = require('./middilewares/errorHandler');
const rideRoutes = require('./routes/rideRoutes');

const app = express();

// --- Middlewares ---

// 2. Enable CORS for all requests.
// This is the crucial step that allows your frontend to talk to your backend.
app.use(cors()); 

// Logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json());


// --- Routes ---
// All our API routes are mounted here.
app.use('/api/v1/ride', rideRoutes);


// --- Error Handling ---
// This must be the last middleware.
app.use(errorHandler);


module.exports = app;

