/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.1.0
 */

//Configs
var config = require("./config/config.json");
var loginInfo = require('./config/real-info.json');
var moveMailService = require("./lib/findProcessMoveMail.js");

//Logger stuff.
var loggerConfig = require("./config/loggerConfig");
var log4js = require('log4js');
log4js.configure(loggerConfig);

//Main (index.js) logger.
var logger = log4js.getLogger("Main program.");

logger.info("System starting...");

moveMailService.init(loginInfo, config, log4js.getLogger("Mail move service."));

//TODO File Logger doesn't write anything to it!...