/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.2.5
 */

'use strict';

/**
 * Configs
 * @type {exports}
 */
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

/**
 * The Imap Object
 * @type {Connection|exports}
 */
var Imap = require('imap');

/**
 * Creates the instance of the Imap object with the provided login info.
 * @type {Object}
 * @param {json} The login json.
 */
var imap = new Imap(loginInfo);

imap.once('ready', function () {

    //setInterval(function(){
    //    moveMailService(imap, config, log4js.getLogger("[Find and move]"), null);
    //},500);

    checkRemindService(imap, config, log4js.getLogger("[Check mail date]"), null);

});

imap.connect();