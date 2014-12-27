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
 * @param config {Object}
 * The login information.
 * @param loginInfo {Object}
 * The program's logger.
 * @param logger {Object}
 */

exports.init = function(loginInfo, config, logger){
    var imap = new Imap(loginInfo);
    var delArray=[];
    imap.once("ready", function(){
        logger.info("Connection to server successful.");
        imap.openBox('INBOX', false, function(err, box){
            if(err)
                logger.trace(err);
            imap.search(['SEEN'], function(err, results){
                if(err)
                    logger.trace(err);
                try {
                    var f = imap.fetch(results, config.fetchParamsInbox);
                    f.on('message', function (msg, seqno) {
                        msg.once('attributes', function (attrs) {
                            imap.setFlags(attrs.uid, '\\Deleted', function(err){
                                if(err)
                                    logger.error("Unhandled error!");
                            });
                            delArray.push(attrs.uid);
                        });
                    });
                    f.once('error', function (err) {
                        logger.trace(err);
                    });
                    f.once('end', function () {
                        logger.info(delArray.length +" mails with id: "+ delArray+" will be deleted");
                        //Deletes read messages.
                        imap.expunge(function () {
                            logger.info("Marked mails will be deleted.");
                        });
                        //Ends the imap connection.
                        imap.end();
                        logger.info("Connection with the server is terminated!");
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
                    imap.end();
                }
            });
        });
    });
    imap.connect();
};
