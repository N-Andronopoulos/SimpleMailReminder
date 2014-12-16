'use strict';

/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.0.1
 */


var Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require('fs'),
    loginInfo = require('./real-info.json');

var imap = new Imap(loginInfo);
var dataToReturn=[];
var connected = false;

/**
 *
 * @param cb The callback function, calls with result boxes.
 */
function getMailBoxes(cb){
    imap.once('ready', function(){
        imap.getBoxes(function(err, boxes) {
            if (err) throw err;
            cb(boxes);
        });
    });
}

/**
 *
 * @param cb The callback function. No arguments.
 */
function connectToImap(cb){
    imap.connect();
    connected = true;
    cb();
}
/**
 *
 * @param cb The callback function. No arguments.
 */
function disconnectFromImap(cb){
    imap.end();
    connected = false;
    cb();
}

/**
 *
 * @param mailBox Mainbox name to use.
 * @param fetchParams Arguments for fetch function. eg.
 * {
 *    bodies: '',
 *    struct: true,
 *    markSeen: false
 * }
 * @param cb cb The callback function. No arguments.
 */
function getUnseenMailFromBox(mailBox, fetchParams, cb){
    imap.once('ready', function() {
        imap.openBox(mailBox, true,function(err, box){
            if (err) throw err;
            imap.search(['UNSEEN'], function(err, results) {
                if (err) throw err;
                var f = imap.fetch(results, fetchParams);
                f.on('message', function(msg, seqno) {
                    console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';
                    msg.on('body', function(stream, info) {
                        var buffer='';
                        console.log(prefix + 'Saving body...');
                        stream.on('data', function(data){
                            buffer += data;
                        });
                        stream.on('end', function(){
                            dataToReturn.push(buffer);
                        });
                    });
                });
                f.once('error', function(err){
                    console.error('Found err: ' + err);
                });
                f.once('end', function() {
                    cb();
                });
            });
        });
    });
}

/**
 *
 * @param mailID The urid of the mail to be moved.
 * @param fromBox The name of the box to move to.
 * @param toBox The name of the box to move from.
 * @param cb The callback function. No arguements.
 */
function moveMailFromTO(mailID, fromBox, toBox, cb){
    imap.once('ready', function(){
        imap.openBox(fromBoxm, false, throws(function(box){
            imap.move(mailID, toBox, cb);
        }));
    });
}


//test stuff gets mail boxes and unread mails from INBOX.
connectToImap(function(){
    var mailboxesArray;
    getMailBoxes(function(boxes){
        //Prints the whole object.
        //console.log(inspect(boxes, {
        //     showHidden: true,
        //     depth: null ,
        //     colors: true
        //}));

        //Just the mailbox names.
        console.log(Object.keys(boxes));
        mailboxesArray = Object.keys(boxes);
    });
    getUnseenMailFromBox('INBOX', {
//TODO change Inbox to mailboxarray[0]
        bodies: '',
        struct: true,
        markSeen: false
    }, function(){
        console.log("ampla");
        for(var tmp in dataToReturn)console.log(dataToReturn[tmp]);
        disconnectFromImap(function() {
            console.log('bye');
        });
    });
});
