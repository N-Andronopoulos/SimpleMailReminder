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
var sendMailService = require('./lib/mailSender.js');


//Logger stuff.
var loggerConfig = require("./config/loggerConfig");
var log4js = require('log4js');
log4js.configure(loggerConfig);

//Main (index.js) logger.
var logger = log4js.getLogger("Main program.");

logger.info("System starting...");

//moveMailService.init(loginInfo, config, log4js.getLogger("Mail move service."));

//cleanMailBox.init(loginInfo, config, log4js.getLogger("MailBox clean service."));

//cleanMailBox.init(loginInfo, config, log4js.getLogger("MailBox clean service."));

var fs = require('fs');
var path = require('path');
var mail = fs.readFileSync(path.join(__dirname,'tmp','data-0.txt'));

sendMailService.sendMail(loginInfo,mail,log4js.getLogger("Mail Sending Service."));
