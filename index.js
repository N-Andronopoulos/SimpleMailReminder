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

var Imap = require('imap');

/**
 * Creates the instance of the Imap object with the provided login info.
 * @type {Object}
 * @param {json} The login json.
 */
var imap = new Imap(loginInfo);
var imap2 = new Imap(loginInfo);
var imap3 = new Imap(loginInfo);
/**
 * Terminates the imap connection.
 */
/*function terminate() {
    setTimeout(function () {
        imap.end();
        logger.debug("Connection is terminated.");
    }, 1000);
}*/
function close(){
    logger.info("box closed");
    imap.closeBox(function(){});
}

function close2(){
    imap2.closeBox(function(){});
}

function close3() {
    imap3.closeBox();
}

imap.once('ready', function () {

    setInterval(function() {
        moveMailService(imap, config, log4js.getLogger("[Find and move]"), close);
    }, 500);
    //
    setInterval(function() {
        cleanMailBox(imap2, config, log4js.getLogger("[MailBox clean]"), close2);
    },500);

    /*

    setInterval(function () {
        checkRemindService(imap3, config, log4js.getLogger("[Check mail date]"), close3);
    },1000);*/

    //moveMailService(imap, config, log4js.getLogger("[Find and move]"), null);
    //
    //setTimeout(function(){
    //    checkRemindService(imap, config, log4js.getLogger("[Check mail date]"), terminate);
    //}, 1000);
    //cleanMailBox(imap, config, log4js.getLogger("[MailBox clean]"), terminate);

});

imap.connect();
imap2.connect();
imap3.connect();