/**
 * Created by Alexander on 27/12/2014.
 * @version 0.1.0
 * @author Alexander Sibetheros
 * @description This lib reads the messages in the reminds folder,
 * calculates and checks if any message must be reminded.
 */

var S = require('string');
var moment = require('moment');

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

    /**
     * Finds the dates in a mail's subject.
     * @param {String} subject The mails subject.
     * @returns {Array|{index: number, input: string}|*|boolean} The result array.
     */
    function parseDates(subject) {
        //TODO Well it's not up to par yet, but its in the right path. :)
        //var array;
        //var res = subject.split(config.tagInMail)[1];
        //if(res!=null) {
        //    res = res.split(config.endTagInMail)[0].replace(/\s/g, "");
        //    array = res.match(config.dateRegex);
        //}
        //return array;
        var res= subject.split(config.tagInMail)[1];
        res = res.split(config.endTagInMail)[0];
        array= res.split(",");
        //TODO add cleanup for spaces klp. We can do correctly but user might make mistakes
        return array;
    }

    //TODO if manualy add msg from inbox to reminds, something doesnt work, something about "sent" flag
    //TODO It doesnt say it's sending a mail but it does....

    /**
     * Finds mails in the designeted folder in the correct tag.
     * @param {EventEmitter}fetch The event of the search result.
     */
    function findSendMail(event) {
        var dateSent = "";
        var remindInterval = "";
        event.on('message', function (msg, seqno) {
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
                //console.log("DIFF: ",a.diff(b, 'days')) // 1
                //TODO LATER if more than 1 date missed, cancel all old
                var timeNow= moment()//.format("D M YYYY")
                var timeReceived = moment("Dec 28 2014","MMM D YYYY");//.format("D M YYYY")

                console.log("Diff is: ",timeNow.diff(timeReceived,"days")," days");
                console.log("Remind dates are: ",remindInterval);
                logger.info("Msg sent:",dateSent," remind:",remindInterval);
                logger.info("Msg sent:", dateSent, " remind:", remindInterval);
            });
        });
        event.once('error', function (err) {
            handleError(err);
        });
        event.once('end', function () {
            if(callBack != null)
                callBack();
        });
    }

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
};