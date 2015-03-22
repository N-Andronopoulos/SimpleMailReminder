/**
 * Created by Alexander on 27/12/2014.
 * @version 0.2.0
 * @author Alexander Sibetheros
 * @description This lib reads the messages in the reminds folder,
 * calculates and checks if any message must be reminded.
 */

    'use strict';
/**
 *
 * @type {Export|exports}
 */
var S = require('string');
var moment = require('moment');
var mailSender = require('./mailSender.js');

/**
 * This function calculate if the mail must be send.
 * @param {object} imap The Imap instance.
 * @param {json} config The configuration json.
 * @param {logger} logger The service logger.
 * @param {function} callBack The function to be called at the end.
 */
module.exports = function (imap, config, logger, callBack) {

    var sendList = [];
    var newRemindInterval = [];

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
        if(callBack !== null)
            callBack();
    }

    /**
     * Finds the dates in a mail's subject.
     * @param {String} subject The mails subject.
     * @returns {Array|{index: number, input: string}|*|boolean} The result array.
     */
    function parseDates(subject) {
        var array = [];
        setTimeout(null,5000);
        var res = subject.split(config.tagInMail)[1];
        if(res!==null) {
            array = res.match( /\d+d|\d+w|\d+m/g );
            if(array === null)
                return [];
            return array;
        }else{
            return [];
        }
    }

    /**
     * Creates the mail to be sent.
     * @param {EventEmitter} event
     */
    function createMail( event ) {
        var mailList = [];
        var mailItem = {
            subject : "",
            to : "",
            from : "",
            text : "",
            encoding : "UTF-8"
        };

        event.on('message', function (msg) {

            msg.once('attributes', function (attrs) {

            });

            msg.on('body', function (stream, info) {
                var buffer = '';
                stream.on('data', function (data) {
                    buffer += data;
                });
                stream.on('end', function () {
                    if(info.which !== "TEXT") {
                        mailItem.to = buffer.split("\n")[2].match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,6}\b/gi);
                        mailItem.from = buffer.split("\n")[1].match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,6}\b/gi);
                        mailItem.subject = buffer.split("\n")[0].replace(/##Remind:\s.*?##/g,config.tagInMail+newRemindInterval+config.endTagInMail);
                    } else
                        mailItem.text = buffer;

                });
            });

            msg.once('end', function (){
                mailList.push(mailItem);
            });

        });

        event.once('error', function (err) {
            handleError(err);
        });

        event.once('end', function () {
            mailList.forEach(function(mail){
                console.log(mail);
                //mailSender.sendMail(mail, logger);
            });
            if(callBack !== null)
                callBack(sendList);
        });
    }

    /**
     * Finds mails in the designeted folder in the correct tag.
     * @param {EventEmitter}event The event of the search result.
     * @param {function} cb
     */
    function findSendMail(event, cb) {
        var dateSent = "";
        var sendItFlag = false;
        var uid = "";
        var remindInterval;
        sendList = [];
        event.on('message', function (msg, seqno) {
            msg.once('attributes', function (attrs) {
                dateSent = attrs.date;
                uid = seqno;
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
                var timeNow = moment();
                var timeReceived;

                newRemindInterval = [];
                sendItFlag = false;
                if(remindInterval.length !== 0){
                    remindInterval.forEach(function(remindTime){
                        var timeSize = remindTime.substring(0,remindTime.length-1);
                        switch (remindTime.slice(-1)){
                            case "d":
                                timeReceived = moment(dateSent).add(timeSize,"d");
                                break;
                            case "w":
                                timeReceived = moment(dateSent).add(timeSize*7,"d");
                                break;
                            case "m":
                                timeReceived = moment(dateSent).add(timeSize,"M");
                                break;
                        }
                        if(parseInt(timeNow.diff(timeReceived,"days")) >= 0)
                            sendItFlag = true;
                        else
                            newRemindInterval.push(remindTime);
                    });
                } else {
                    imap.setFlags(uid, '\\Deleted', function(err){
                        if(err){
                            handleError(err);
                        }
                    });
                }

                //logger.info("Writing new intervals: " + newRemindInterval);
                //logger.info("Old Remind dates are: " + remindInterval);
                if(sendItFlag) {
                    var additem = {
                        uid: uid,
                        subject: newRemindInterval
                    };
                    sendList.push(additem);
                }
            });
        });
        event.once('error', function (err) {
            handleError(err);
        });
        event.once('end', function () {
            imap.expunge(function () {
                logger.info("Marked mails will be deleted.");
            });
            cb();
        });
    }

    imap.openBox(config.destinationBox, false, function (err, box) {
        if (err)
            handleError(err);

        imap.search(['ALL'], function (err, results) {
            if (err)
                handleError(err);
            try {
                findSendMail( imap.fetch(results, config.fetchParamsInbox), function(){
                    sendList.forEach(function(item, index, array){
                        var arlist= [];
                        arlist.push(item.uid+'');
                        imap.search(arlist, function(err, results){
                            createMail( imap.fetch(results, config.createMailParams) );
                        });
                    });
                });
            }
            catch (err) {
                handleError(err);
            }
        });
    });


};