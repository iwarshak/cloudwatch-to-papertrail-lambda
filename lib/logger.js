// Dependencies
var zlib = require('zlib');
var winston = require('winston');

// Extract and unzip log data from event object
exports.extract = function(event) {
  return new Promise(function(resolve, reject) {
    var payload = Buffer.from(event.awslogs.data, 'base64');

    zlib.gunzip(payload, function(err, result){
      if(err){
        console.error("Unable to unzip event payload");
        return reject(err);
      }
      result = JSON.parse(result.toString('utf-8'));
      resolve(result);
    });
  });
};

// Post logs using the given transport
exports.post = function(data, transport) {
  return new Promise(function(resolve, reject) {
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
      return reject(err);
    });

    // Transport connected, log all logEvents
    transport.connection.on('connect', function(){
        var logsToSend = data.logEvents.length;
        var logsSent = 0;

        // Listen for when logs are actually sent
        transport.on('logged', function() {
          logsSent++;
          if (logsSent === logsToSend) {
            // All logs sent, close transport
            transport.close();
            return resolve();
          }
        });

        // Send all log events
        data.logEvents.forEach(function(logEvent){
          logger.info(logEvent.message);
        });
    });
  });
};
