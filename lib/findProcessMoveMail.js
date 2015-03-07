/**
 * Created by Nikolas on 17/12/2014.
 * @version 0.2.0
 * @description This js get the mail from the INBOX folder and moves compliant
 * mails to a designated folder.
 *
 */

var S = require('string');

/**
 * This function initiates the listeners for find and move mail.
 * @param {Object} config The config json.
 * @param {Object} loginInfo The login information for the imap server
 * @param {Object} logger The systems logger.
 */
module.exports = function(imap, loginInfo, config, logger, callBack) {

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
        if(callBack != null)
            callBack();
    };

    /**
     * Upon end tf the message reading functions, mail are moved to an other
     * folder in map ('destinationBox') and the connection to the server is
     * destroyed.
     */
    var moveAndDeleteMails = function () {
        if (msgIDsToRemind.length > 0) {
            logger.info("Mail UID: " + msgIDsToRemind + " needs to be moved.");
            for (var id in msgIDsToRemind) {
                imap.move(msgIDsToRemind[id], config.destinationBox, function (err) {
                    if (err)
                        handleError(err);
                });
            }
        } else {
            logger.info("No messages found for the reminder service.");
        }
        imap.expunge(function () {
            logger.info("Marked mails will be deleted.");
        });
        logger.info("Connection with the server is terminated!");
        msgIDsToRemind = [];

        if(callBack != null)
            callBack();
    };

    /**
     * The fucntion that checks the mail's content and adds the ids to an array.
     * @param listener Is the imap.fetch listener.
     */
    var checkMail = function(listener){
        listener.on('message', function (msg, seqno) {
            var gotRemMail = false;

            msg.once('attributes', function (attrs) {
                if (gotRemMail) {
                    msgIDsToRemind.push(attrs.uid);
                    gotRemMail = false;
                }
            });

            msg.on('body', function (stream, info) {

                var buffer = '';

                stream.on('data', function (data) {
                    buffer += data;
                });

                stream.on('end', function () {
                    var temp = buffer.split("Subject: ")[1];
                    if ( S(temp).contains(config.tagInMail) ) {
                        logger.info("This mail with id: %d needs to be reminded!", seqno);
                        gotRemMail = true;
                    } else
                        logger.info("Mail with id: %d is common Junk.", seqno);
                });
            });

        });

        listener.once('error', function (err) {
            handleError(err);
        });

        listener.once('end', function () {
            moveAndDeleteMails();
        });
    };

    /**
     * Setup listeners.
     */
    imap.once('ready', function () {
        imap.openBox('INBOX', false, function (err) {
            if (err){
                handleError(err);
            }
            imap.search(['UNSEEN'], function (err, results) {
                if(err){
                    handleError(err);
                }
                try {
                    checkMail( imap.fetch(results, config.fetchParamsInbox) );
                } catch(err) {
                    handleError(err);
                }
            });
        });
    });

};
