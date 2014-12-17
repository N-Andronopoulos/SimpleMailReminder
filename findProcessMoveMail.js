/**
 * Created by Nikolas on 17/12/2014.
 * @version 0.0.1
 * @description This js get the mail from the INBOX folder and moves compliant
 * mails to a designeted folder.
 *
 */

//TODO Functionalize this.


//Imports and Jsons
var Imap = require('imap');
var inspect = require('util').inspect;
var fs = require('fs');
var loginInfo = require('./real-info.json');

//Data
var imap = new Imap(loginInfo);
var msgIDsToRemind=[];
var destinationBox='Reminds';
/**
 * The parameters used in imap.fetch
 * //TODO markSeen=true after development is complete.
 * @type {{bodies: string, struct: boolean, markSeen: boolean}}
 */
var fetchParams = {
    bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
    struct: false,
    markSeen: false
};

imap.once('ready', function(){
    imap.openBox('INBOX', true, function(err, box){
        imap.search(['UNSEEN'], function(err, results){
            var f = imap.fetch(results, fetchParams);
            f.on('message', function(msg, seqno) {
                msg.on('body', function(stream, info) {
                    /**
                     * Use to get the mail object stream.
                     * @type {string}
                     */
                    var buffer='';
                    stream.on('data', function(data){
                        buffer += data;
                    });
                    stream.on('end', function(){
                        //TODO Search header for special string.
                        //Use bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)'
                        //TODO Strip these headers and get extract info like {to, form, subject}
                        //Maybe use new external module?
                        //TODO Search subject for special string with OUR info on reminds
                        //Same as above
                        //TODO Note the mail's segno to the array(msgIDsToRemind).
                        msgIDsToRemind.push(seqno);
                        console.log(buffer);
                    });
                });
            });
            f.once('error', function(err){
                //TODO Logger here
                console.error('Found err: ' + err);
            });
            f.once('end', function() {
                //TODO Move the marked messages(msgIDsToRemind) to the other mailBox.
                //Needs a bit more thinking than this unfortunately.
                for(var id in msgIDsToRemind) console.log(msgIDsToRemind[id]);
                for(var id in msgIDsToRemind) imap.move(msgIDsToRemind[id], 'Reminds', function(err){
                    if(err) throw err;
                });
                //Ends the imap connection.
                imap.end();
            });
        });
    });
});

imap.connect();
