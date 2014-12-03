'use strict';

//Requirements
var Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require('fs'),
    loginInfo = require('./real-info.json');

//Create new Imap object
var imap = new Imap(loginInfo);

var dataToReturn=[];
var connected = false;

function getMailBoxes(cb){
    imap.once('ready', function(){
        imap.getBoxes(function(err, boxes) {
            if (err) throw err;
            cb(boxes);
        });
    });
}

function connectToImap(cb){
    imap.connect();
    connected = true;
    cb();
}

function disconnectFromImap(cb){
    imap.end();
    connected = false;
    cb();
}

function getUnseenMailFromBox(mailBox, fetchParams, cb){
    imap.once('ready', function() {
        imap.openBox(mailBox, true,function(err, box){
            if (err) throw err;
            imap.search(['UNSEEN'], function(err, results) {
                if (err) throw err;
                var f = imap.fetch(results,fetchParams);
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

function moveMailFromTO(mailID, fromBox, toBox){
    imap.once('ready', function(){

    });
}

connectToImap(function(){
    getMailBoxes(function(boxes){
        //TODO how do we get only the box names???
        console.log(inspect(boxes, {
             showHidden: true,
             depth: null ,
             colors: true
        }));
        disconnectFromImap(function() {
            console.log('bye');
        });
    });
});


