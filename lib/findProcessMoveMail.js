/**
 * Created by Nikolas on 17/12/2014.
 * @version 0.2.5
 * @description This js get the mail from the INBOX folder and moves compliant
 * mails to a designated folder.
 *
 */

'use strict';

/**
 * The external String library.
 * @type {exports}
 */
var S = require('string');

module.exports = run;

/**
 * This function initiates the listeners for find and move mail.
 * @type {exports}
 * @param {Connection} imap The instance of the Imap object.
 * @param {json} config
 *  @param {Array} config.destinationBox
 *  @param {Boolean} config.tagInMail
 *  @param {string} config.fetchParamsInbox
 * @param {logger} logger The systems logger.
 * @param {function} callBack The callback to be run at the end.
 * @return
 */
function run(imap, config, logger, callBack) {

    var msgIDsToRemind=[];

    /**
     * The error which is thrown.
     * @param {Error} err
     */
    function handleError(err){
        switch(err.message){
            case "Nothing to fetch" :
                logger.info("No new messages.");
                break;
            default :
                logger.error("Unhandled error!");
                logger.trace(err);
                break;
        }
        if(callBack !== null)
            callBack();
    }

    /**
     * Upon end tf the message reading functions, mail are moved to an other
     * folder in map ('destinationBox') and the connection to the server is
     * destroyed.
     */
    function moveAndDeleteMails() {
        if (msgIDsToRemind.length > 0) {
            logger.info("Mail UID: " + msgIDsToRemind + " needs to be moved.");
            /* jshint ignore:start */
            for (var id in msgIDsToRemind) {
                if (id !== null) {
                    imap.move(msgIDsToRemind[id], config.destinationBox, function (err) {
                        if (err)
                            handleError(err);
                    });
                }
            }
            /* jshint ignore:end */
        } else {
            logger.info("No messages found for the reminder service.");
        }
        imap.expunge(function () {
            logger.info("Marked mails will be deleted.");
        });
        msgIDsToRemind = [];

        if(callBack !== null)
            callBack();
    }

    /**
     * The fucntion that checks the mail's content and adds the ids to an array.
     * @param {EventEmitter} listener Is the imap.fetch listener.
     */
    function checkMail(listener){
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
                        this.logger.info("Mail with id: %d is common Junk.", seqno);
                });
            });

        });

        listener.once('error', function (err) {
            handleError(err);
        });

        listener.once('end', function () {
            moveAndDeleteMails();
        });
    }

    /**
     * Setup listeners.
     */
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
}
