/**
 * Created by Alexander on 27/12/2014.
 * @version 1.0.0
 * @author Alexander Sibetheros
 * @description This lib reads the messages in the reminds folder,
 * calculates and checks if any message must be reminded.
 */

'use strict';
/**
 *
 * @type {exports}
 */
var S = require('string');
var moment = require('moment');
var mailSender = require('./mailSender.js');
var MailParser = require('mailParser').MailParser;

/**
 * This function calculate if the mail must be send.
 * @param {Connection} imap The Imap instance.
 * @param {object} config The configuration json.
 *  @param {string} config.tagInMail
 *  @param {string} config.destinationBox
 *  @param {string} config.fetchParamsInbox
 *  @param {string} config.createMailParams
 *  @param {string} config.endTagInMail
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
        switch (err.message) {
            case "Nothing to fetch" :
                logger.info("No old messages.");
                break;
            default :
                logger.error("Unhandled error!");
                logger.trace(err);
                break;
        }
        if (callBack !== null)
            callBack();
    }

    /**
     * Finds the dates in a mail's subject.
     * @param {String} subject The mails subject.
     * @returns {Array|{index: number, input: string}|*|boolean} The result array.
     */
    function parseDates(subject) {
        var array = [];
        var res = subject.split(config.tagInMail)[1];
        if (res !== null) {
            array = res.match(/\d+d|\d+w|\d+m/g);
            if (array === null)
                return [];
            return array;
        } else {
            return [];
        }
    }

    /**
     * Creates the mail to be sent.
     * @param {EventEmitter} event
     * @param {string} subject New dates array.
     */
    function createMail(event, subject) {
        var mailList = [];
        var mailItem;
        var mailParser = new MailParser();

        event.on('message', function (msg) {
            msg.on('body', function (stream) {
                var buffer = '';
                stream.on('data', function (data) {
                    buffer += data;
                });

                stream.on('end', function () {
                    mailItem = buffer;
                });
            });

            msg.once('end', function () {
                mailList.push(mailItem);
            });
        });

        event.once('error', function (err) {
            handleError(err);
        });

        event.once('end', function () {
            mailList.forEach(function (mail) {
                mailParser.once("end", function (mail_object) {

                    var tempFrom = mail_object.from;
                    mail_object.from = mail_object.to;
                    mail_object.to = tempFrom;
                    var tempMailObj = {
                        headers: "",
                        to: "",
                        from: "",
                        cc: "",
                        bcc: "",
                        subject: "",
                        text: "",
                        html: "",
                        attachments: "",
                        priority: "",
                        date: "",
                        references: "",
                        inReplyTo: ""
                    };
                    tempMailObj.to = mail_object.to;
                    tempMailObj.from = mail_object.from;

                    if (subject.length <= 0 || subject === 'undefined') {
                        tempMailObj.subject = mail_object.subject
                                .split(config.tagInMail)[0] +
                            mail_object.subject
                                .split(config.tagInMail)[1]
                                .split(config.endTagInMail)[1];
                    } else {
                        tempMailObj.subject = mail_object.subject.split(config.tagInMail)[0] +
                            config.tagInMail +
                            subject.toString().replace(",", " ") +
                            config.endTagInMail +
                            mail_object.subject
                                .split(config.tagInMail)[1]
                                .split(config.endTagInMail)[1];
                    }

                    tempMailObj.cc = mail_object.cc;
                    //tempMailObj.bcc = mail_object.bcc;
                    tempMailObj.text = mail_object.text;
                    tempMailObj.html = mail_object.html;
                    tempMailObj.attachments = mail_object.attachments;
                    tempMailObj.priority = mail_object.priority;
                    //tempMailObj.date = mail_object.date;
                    tempMailObj.references = mail_object.references;
                    tempMailObj.inReplyTo = mail_object.inReplyTo;

                    logger.debug(subject);
                    logger.debug(tempMailObj);
                    mailSender.sendMail(tempMailObj, logger, callBack);
                });
                mailParser.write(mail);
                mailParser.end(null);
            });
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
        var segNo = "";
        var uid = "";
        var remindInterval;
        sendList = [];
        event.on('message', function (msg, seqno) {
            msg.once('attributes', function (attrs) {
                dateSent = attrs.date;
                uid = attrs.uid;
                segNo = seqno;
            });

            msg.on('body', function (stream) {
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
                if (remindInterval.length !== 0) {
                    remindInterval.forEach(function (remindTime) {
                        var timeSize = remindTime.substring(0, remindTime.length - 1);
                        switch (remindTime.slice(-1)) {
                            case "d":
                                timeReceived = moment(dateSent).add(timeSize, "d");
                                break;
                            case "w":
                                timeReceived = moment(dateSent).add(timeSize * 7, "d");
                                break;
                            case "m":
                                timeReceived = moment(dateSent).add(timeSize, "M");
                                break;
                        }
                        if (parseInt(timeNow.diff(timeReceived, "days")) >= 0)
                            sendItFlag = true;
                        else
                            newRemindInterval.push(remindTime);
                    });
                } else {
                    imap.setFlags(uid, '\\Deleted', function (err) {
                        if (err) {
                            handleError(err);
                        }
                    });
                }

                if (sendItFlag) {
                    var additem = {
                        uid: segNo,
                        subject: newRemindInterval,
                        realUid: uid
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

    imap.openBox(config.destinationBox, false, function (err) {
        if (err)
            handleError(err);

        imap.search(['ALL'], function (err, results) {
            if (err)
                handleError(err);
            try {
                findSendMail(imap.fetch(results, config.fetchParamsInbox), function () {
                    sendList.forEach(function (item) {
                        var arlist = [];
                        arlist.push(item.uid + '');
                        imap.search(arlist, function (err, results) {
                            createMail(imap.fetch(results, config.createMailParams), item.subject);
                            imap.setFlags(item.realUid, '\\Deleted', function (err) {
                                if (err) {
                                    handleError(err);
                                }
                                logger.info("Deleting mail with uid: ", item.realUid);
                            });
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