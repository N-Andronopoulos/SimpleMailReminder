/**
 * Created by Alexander on 27/12/2014.
 * @version 0.0.1
 * @author Alexander Sibetheros
 * @description This lib reads the messages in the reminds folder,
 * calculates and checks if any message must be reminded.
 */

var Imap = require('imap');
var S = require('string');

exports.init = function(loginInfo, config, logger){

function parseDates(subject){
	var res= subject.split(config.tagInMail)[1];
	res = res.split(config.endTagInMail)[0];
	array= res.split(",");
	//TODO add cleanup for spaces klp. We can do correctly but user might make mistakes
	return array;
}

//TODO if manualy add msg from inbox to reminds, something doesnt work, something about "sent" flag
    var imap = new Imap(loginInfo);

    imap.once("ready", function(){
        logger.info("Connection to server successful.");
        imap.openBox(config.destinationBox, false, function(err, box){
            if(err)
                logger.trace(err);
            imap.search(['ALL'], function(err, results){
                if(err)
                    logger.trace(err);
                try {
                    var f = imap.fetch(results, config.fetchParamsInbox);
			var dateSent="";
			var remindInterval="";
                    f.on('message', function (msg, seqno) {
                        msg.once('attributes', function (attrs) {
				dateSent=attrs.date;
                        });
			
			msg.on('body', function (stream, info) {
                            var buffer = '';
                            stream.on('data', function (data) {
                                buffer += data;
                            });
                            stream.on('end', function () {
                                var temp = buffer.split("Subject: ")[1].split("\n")[0];
				var subject = S(temp).s;                                
				remindInterval=parseDates(subject); 
                            });
                        });
			msg.once('end',function(){
				logger.info("Msg sent:",dateSent," remind:",remindInterval);
			});
                    });
                    f.once('error', function (err) {
                        logger.trace(err);
                    });
                    f.once('end', function () {
			
                        //Ends the imap connection.
                        imap.end();
                        logger.info("Connection with the server is terminated!");
                    });
                }
                catch(e){
                    if(e.message == "Nothing to fetch"){
                        logger.info("No messages to remind.");
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

