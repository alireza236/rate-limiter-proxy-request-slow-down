const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const slowDown = require("express-slow-down")

const limiter = rateLimit({
  windowMs:   30 * 1000, // 15 minutes
  max: 5 // limit each IP to 100 requests per windowMs
});

const speedLimiter = slowDown({
  windowMs:  30 * 3000, // 15 minutes
  delayAfter: 1, // allow 5 requests to go at full-speed, then...
  delayMs: 500 // 6th request has a 100ms delay, 7th has a 200ms delay, 8th gets 300ms, etc.
});
 

const router = express.Router();

//https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0
const BASE_URL = "https://api.nasa.gov/insight_weather/?";

let cacheTime;
let cacheData;

router.get('/', limiter,speedLimiter, async (req, res, next) => {
  /// in memory cache
  if (cacheTime && cacheTime > Date.now() - 30 * 1000) {
        
    return res.json(cacheData)
  }
   
  try {

    const params = new URLSearchParams({
      api_key: process.env.NASA_API_KEY,
      feedtype : 'json',
      ver: '1.0'  
    });
    
    // 1 make request to nasa api
    const { data } = await axios.get(`${BASE_URL}${params}`)

    cacheData = data;
    cacheTime = Date.now();
    data.cacheTime = cacheTime
    
    return res.json(data);
    
  } catch (error) {
     return next(error)
  }
  

});

module.exports = router;
