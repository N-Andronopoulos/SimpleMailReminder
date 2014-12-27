/**
 * Created by Nikolas on 17/12/2014.
 * @version 0.1.0
 * @description This js get the mail from the INBOX folder and moves compliant
 * mails to a designated folder.
 *
 */

//TODO Maybe keep the connection open and do other stuff. FUTURE

//Imports and Jsons
var Imap = require('imap');
var S = require('string');

/**
 * The config json.
 * @param config
 * The login information for the imap server
 * @param loginInfo
 * The logger.
 * @param logger
 */
exports.init = function(loginInfo, config, logger) {
    var imap = new Imap(loginInfo);
    var msgIDsToRemind=[];

    /**
     * The error which is thrown.
     * @param {Object} err
     */
    var handleError = function(err){
        switch(err.message){
            case "Nothing to fetch" :
                logger.info("No new messages.");
                break;
            default :
                logger.error("Unhandled error!");
                logger.trace(err);
                break;
        }
        imap.end();
        logger.info("Connection with the server is terminated!");
        msgIDsToRemind = [];
    }

    /**
     * Setup listeners.
     */
    imap.once('ready', function () {
        logger.info("Connection with the server is successful!");
        imap.openBox('INBOX', false, function (err, box) {
            if (err){
                handleError(err);
            }
            imap.search(['UNSEEN'], function (err, results) {
                if(err){
                    handleError(err);
                }
                try {
                    var f = imap.fetch(results, config.fetchParamsInbox);
                    f.on('message', function (msg, seqno) {
                        /**
                         * Flag to if the mail is for the service.
                         * @type {boolean}
                         */
                        var gotRemMail = false;

                        /**
                         * This listener stores the attributes of a mail if the flag 'gotReMail'
                         * is raised.
                         */
                        msg.once('attributes', function (attrs) {
                            if (gotRemMail) {
                                msgIDsToRemind.push(attrs.uid);
                                gotRemMail = false;
                            }
                        });
                        /**
                         * This listener check if the subject of a mail has the given ('tagInMail')
                         * unique string.
                         */
                        msg.on('body', function (stream, info) {
                            var buffer = '';
                            stream.on('data', function (data) {
                                buffer += data;
                            });
                            stream.on('end', function () {
				//Changed this line because your trick only worked for emails from self..for some reason
                                var temp = buffer.split("Subject: ")[1];
				logger.info("After Subject Split=",temp)
                                if ( S(temp).contains(config.tagInMail) ) {
                                    logger.info("This mail with id: %d needs to be reminded!", seqno);
                                    gotRemMail = true;
                                } else
                                    logger.info("Mail with id: %d is common Junk.", seqno);
                            });
                        });
                    });
                    f.once('error', function (err) {
                        handleError(err);
                    });
                    /**
                     * Upon end tf the message reading functions, mail are moved to an other
                     * folder in map ('destinationBox') and the connection to the server is
                     * destroyed.
                     */
                    f.once('end', function () {
                        if (msgIDsToRemind.length > 0) {
                            for (var id in msgIDsToRemind)
                                logger.info("Mail UID: " + msgIDsToRemind[id] + " needs to be moved.");

                            for (var id in msgIDsToRemind)
                                imap.move(msgIDsToRemind[id], config.destinationBox, function (err) {
                                    if (err)
                                        logger.trace(err);
                                });
                        } else {
                            logger.info("No messages found for the reminder service.");
                        }
                        //Deletes read messages.
                        imap.expunge(function () {
                            logger.info("Marked mails will be deleted.");
                        });
                        //Ends the imap connection.
                        imap.end();
                        logger.info("Connection with the server is terminated!");
                        msgIDsToRemind = [];
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
