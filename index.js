/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.2.3
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
logger.debug("Service starting...");

var Imap = require('imap');

/**
 * Creates the instance of the Imap object with the provided login info.
 * @type {Object}
 * @param {JSON} The login json.
 */
var imap = new Imap(loginInfo);

/**
 * Terminates the imap connection.
 */
function terminate(){
    setTimeout(function() {
        imap.end();
        logger.debug("Connection is terminated.");
    },1000);
};

imap.once('ready', function(){
    moveMailService(imap, config, log4js.getLogger("[Find and move]"), function(){
        cleanMailBox(imap, config, log4js.getLogger("[MailBox clean]"), function(){
            checkRemindService(imap, config, log4js.getLogger("[Check mail date]"), terminate);
        });
    });
});

imap.connect();
