/**
 * Created by Alexander on 27/12/2014.
 * @version 0.0.3
 * @author Alexander Sibetheros
 * @description This lib reads the messages in the reminds folder,
 * calculates and checks if any message must be reminded.
 */

var S = require('string');

/**
 * This function calculate if the mail must be send.
 * @param {Imap} imap The Imap instance.
 * @param {JSON} config The configuration json.
 * @param {Logger} logger The service logger.
 * @param {function} callBack The function to be called at the end.
 */
module.exports = function (imap, config, logger, callBack) {

    /**
     * The error which is thrown.
     * @param {Error} err
     */
    function handleError(err) {

        switch(err.message){
            case "Nothing to fetch" :
                logger.info("No old messages.");
                break;
            default :
                logger.error("Unhandled error!");
                logger.trace(err);
                break;
        }
        if(callBack != null)
            callBack();
    };

    function parseDates(subject) {
        var res = subject.split(config.tagInMail)[1];
        res = res.split(config.endTagInMail)[0];
        array = res.split(",");
        //TODO add cleanup for spaces klp. We can do correctly but user might make mistakes
        return array;
    }

    //TODO if manualy add msg from inbox to reminds, something doesnt work, something about "sent" flag

    function findSendMail(fetch) {
        var dateSent = "";
        var remindInterval = "";
        f.on('message', function (msg, seqno) {
            msg.once('attributes', function (attrs) {
                dateSent = attrs.date;
            });

            msg.on('body', function (stream, info) {
                var buffer = '';
                stream.on('data', function (data) {
                    buffer += data;
                });
                stream.on('end', function () {
                    var temp = buffer.split("Subject: ")[1].split("\n")[0];
                    var subject = S(temp).s;
                    remindInterval = parseDates(subject);
                });
            });
            msg.once('end', function () {
                logger.info("Msg sent:", dateSent, " remind:", remindInterval);
            });
        });
        f.once('error', function (err) {
            logger.trace(err);
        });
        f.once('end', function () {
            //Nothing
            //I think here must the mail be sent.
            if(callBack != null)
                callBack();
        });
    }

    imap.once("ready", function () {
        imap.openBox(config.destinationBox, false, function (err, box) {
            if (err)
                handleError(err);
            imap.search(['ALL'], function (err, results) {
                if (err)
                    handleError(err);
                try {
                    findSendMail( imap.fetch(results, config.fetchParamsInbox) );
                }
                catch (err) {
                    handleError(err);
                }
            });
        });
    });
};


