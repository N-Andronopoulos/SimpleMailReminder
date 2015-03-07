/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.1.0
 */

//Configs
var config = require("./config/config.json");
var loginInfo = require('./config/real-info.json');
var moveMailService = require("./lib/findProcessMoveMail.js");
var cleanMailBox = require("./lib/cleanMailBox.js");
var checkRemindService = require('./lib/checkReminds.js');

//Logger stuff.
var loggerConfig = require("./config/loggerConfig");
var log4js = require('log4js');
log4js.configure(loggerConfig);

//Main (index.js) logger.
var logger = log4js.getLogger("Main program.");

process.name = "SimpleMailReminder";

moveMailService(loginInfo, config, log4js.getLogger("[Mail move service]"));
cleanMailBox(loginInfo, config, log4js.getLogger("[MailBox clean service]"));
checkRemindService(loginInfo, config, log4js.getLogger("[Mail check service]"));

