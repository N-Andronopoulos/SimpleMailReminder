/**
 * Created by Nikolas on 26/12/2014.
 * @version 0.1.0
 * @author Nikolas Andronopoulos, Alexander Sibetheros
 * @description This lib clears up any unmoved and seen messages
 * for the given mail box, usualy the Inbox mail box.
 */

var Imap = require('imap');

/**
 * The configuration file.
 * @param config {Object}
 * The login information.
 * @param loginInfo {Object}
 * The program's logger.
 * @param logger {Object}
 */
module.exports = function(loginInfo, config, logger){
    /**
     * The connection to the imap server.
     * @type {Connection}
     */
    var imap = new Imap(loginInfo);
    /**
     * The array the UID of the mails to be deleted.
     * @type {Array}
     */
    var delArray=[];
    /**
     * The error which is thrown.
     * @param {Object} err
     */
    var handleError = function(err){
        switch(err.message){
            case "Nothing to fetch" :
                logger.info("No old messages.");
                break;
            default :
                logger.error("Unhandled error!");
                logger.trace(err);
                break;
        }
        imap.end();
        logger.info("Connection with the server is terminated!");
    };

    imap.once("ready", function(){
        logger.info("Connection to the server successful.");
        imap.openBox('INBOX', false, function(err){
            if(err){
                handleError(err);
            }
            imap.search(['SEEN'], function(err, results){
                if(err){
                    handleError(err);
                }
                try {
                    var f = imap.fetch(results, config.fetchParamsCleaner);
                    f.on('message', function (msg) {
                        msg.once('attributes', function (attrs) {
                            imap.setFlags(attrs.uid, '\\Deleted', function(err){
                                if(err){
                                    handleError(err);
                                }
                            });
                            delArray.push(attrs.uid);
                        });
                    });
                    f.once('error', function (err) {
                        handleError(err);
                    });
                    f.once('end', function () {
                        logger.info(delArray.length +" mails with id: "+ delArray+" will be deleted");
                        imap.expunge(function () {
                            logger.info("Marked mails will be deleted.");
                        });
                        imap.end();
                        logger.info("Connection with the server is terminated!");
                    });
                }
                catch(e){
                    handleError(e);
                }
            });
        });
    });
    imap.connect();
};
