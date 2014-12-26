/**
 * Created by Nikolas on 26/12/2014.
 * @version 0.0.1
 * @author Nikolas Andronopoulos
 * @description This lib clears up any unmoved and seen messages
 * for the given mail box, usualy the Inbox mail box.
 */

var Imap = require('imap');

/**
 * The configuration file.
 * @param config @type {json}
 * The login information.
 * @param loginInfo @type {json}
 * The program's logger.
 * @param logger {Logger}
 */
exports.init = function(loginInfo, config, logger){
    var imap = new Imap(loginInfo);
    var inspect = require('util').inspect;

    imap.once("ready", function(){
        logger.info("Connection to server successful.");
        imap.openBox('INBOX', false, function(err, box){
            if(err)
                logger.trace(err);
            logger.info(box);
            imap.search(['SEEN'], function(err, results){
                if(err)
                    logger.trace(err);
                try {
                    var f = imap.fetch(results, config.fetchParamsInbox);
                    f.on('message', function (msg, seqno) {
                        msg.once('attributes', function (attrs) {
                            logger.info(attrs);
                            imap.setFlags(seqno, '\\Deleted', function(err){
                                if(err)
                                    logger.error("Unhandled error!");
                            });
                            logger.info(attrs);
                        });
                    });
                    f.once('error', function (err) {
                        logger.trace(err);
                    });
                    f.once('end', function () {
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
                    if(e.message == "Nothing to fetch"){
                        logger.info("No old messages.");
                    }else {
                        logger.error("Unhandled error!");
                        logger.trace(e);
                    }
                    logger.info("Connection with the server is terminated!");
                    msgIDsToRemind = [];
                    imap.end();
                }
            });
        });
    });
    imap.connect();
};
