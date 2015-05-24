/**
 * Created by Nikolas on 26/12/2014.
 * @version 0.3.0
 * @author Nikolas Andronopoulos, Alexander Sibetheros
 * @description This lib clears up any unmoved and seen messages
 * for the given mail box, usualy the Inbox mail box.
 */

'use strict';

/**
 * This function removes read messages from imap server.
 * @param {Connection} imap The instance of the Imap object.
 * @param {object} config
 *  @param {Array} config.destinationBox
 *  @param {Boolean} config.tagInMail
 *  @param {string} config.fetchParamsCleaner
 * @param {logger} logger The systems logger.
 * @param {function} callBack The callback to be run at the end.
 */
module.exports = function(imap, config, logger, callBack){

    var delArray=[];

    /**
     * The error which is thrown.
     * @param {Error} err
     */
    function handleError(err){

        switch(err.message){
            case "Nothing to fetch" :
                logger.info("No old messages.");
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
     * This function remove any read messages from the server's main folder.
     * @param {EventEmitter} listener
     */
    function removeMail(listener) {

        listener.on('message', function (msg) {
            msg.once('attributes', function (attrs) {
                imap.setFlags(attrs.uid, '\\Deleted', function(err){
                    if(err){
                        handleError(err);
                    }
                });
                delArray.push(attrs.uid);
            });
        });

        listener.once('error', function (err) {
            handleError(err);
        });

        listener.once('end', function () {
            logger.info(delArray.length +" mails with id: "+ delArray+" will be deleted");
            imap.expunge(function () {
                logger.info("Marked mails will be deleted.");
            });
            if(callBack !== null)
                callBack();
        });
    }

    imap.openBox('INBOX', false, function(err){
        if(err){
            handleError(err);
        }
        imap.search(['SEEN'], function(err, results){
            if(err){
                handleError(err);
            }
            try {
                removeMail( imap.fetch(results, config.fetchParamsCleaner) );
            }
            catch(e){
                handleError(e);
            }
        });
    });
};
