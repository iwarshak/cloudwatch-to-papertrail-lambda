// Dependencies
var zlib = require('zlib');
var winston = require('winston');

// Extract and unzip log data from event object
exports.extract =  function(event, callback){

  var payload = Buffer.from(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function(err, result){
    if(err){
      console.error("Unable to unzip event payload");
      return callback(err);
    }
    result = JSON.parse(result.toString('utf-8'));
    callback(null, result);
  });

};

// Post logs using the given transport
exports.post = function(data, transport, callback){
  // Create a new Logger using the transport parameter with custom format
  var logger = winston.createLogger({
    format: winston.format.printf(function(info) {
      return info.message;
    }),
    transports: [ transport ]
  });

  // If the transport fails, return error
  transport.connection.on('error', function(err){
    console.error("Error:", err.code, "-", err.message);
    return callback(err);
  });

  // Transport connected, log all logEvents
  transport.connection.on('connect', function(){
      data.logEvents.forEach(function(logEvent){
        logger.info(logEvent.message);
      });
      // Close transport, return successful
      transport.close();
      return callback();
  });
};
