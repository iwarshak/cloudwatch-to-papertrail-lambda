// exports.handler = async (event, context) => {
//   console.log('Remaining time: ', context.getRemainingTimeInMillis())
//   console.log('Function name: ', context.functionName)
//   console.log('env is: ', process.env);
//   return "hello from lambda"
// }

// Dependencies
var logger = require('./lib/logger');
var winston = require('winston');
var PapertrailTransport = require('winston-papertrail-transport').PapertrailTransport;

// Handler function
exports.handler = async function(event, context) {
  try {
    // Extract data from event
    var data = await logger.extract(event);

    // Construct the winston transport for forwarding lambda logs to papertrail
    var papertrail = new PapertrailTransport({
      host: process.env.PAPERTRAIL_HOST,
      port: parseInt(process.env.PAPERTRAIL_PORT),
      hostname: process.env.PAPERTRAIL_NAME,
      program: data.logGroup.split('/').pop()
    });

    // post the logs
    await logger.post(data, papertrail);

    return { statusCode: 200, body: 'Logs forwarded successfully' };
  } catch (err) {
    console.error('Error processing logs:', err);
    throw err;
  }
};
