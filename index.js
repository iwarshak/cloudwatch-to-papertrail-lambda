// exports.handler = async (event, context) => {
//   console.log('Remaining time: ', context.getRemainingTimeInMillis())
//   console.log('Function name: ', context.functionName)
//   console.log('env is: ', process.env);
//   return "hello from lambda"
// }

// Dependencies
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-papertrail').Papertrail;

// Handler function
exports.handler = function(event, context, callback){

  // Extract data from event
  logger.extract(event, function(err, data){
    if(err)
      return callback(err);

    // Construct the winston transport for forwarding lambda logs to papertrail
    var papertrail = new winston.transports.Papertrail({
      host: process.env.PAPERTRAIL_HOST,
      port: process.env.PAPERTRAIL_PORT,
      hostname: process.env.PAPERTRAIL_NAME, // "Lambda_" + data.owner + "_" + process.env.AWS_REGION,
      program: data.logGroup.split('/').pop(),
      logFormat: function(level, message){
        return message;
      }
    });
    // post the logs
    logger.post(data, papertrail, callback);
  });
};
