/**
 * Created by Nikolas on 28/12/2014.
 * @version 0.0.1
 * @author Nikolas Andronopoulos
 * @description This lib sends an email via smtp.
 */

/**
 * This function sends a mail.
 * @param {Logger} logger The logger.
 * @param {JSON} loginInfo The login information file.
 * @param {String} mail The mail to be send.
 */
exports.sendMail = function(loginInfo, mail, logger){
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: loginInfo.user,
            pass: loginInfo.password
        }
    });

    var MailParser = require("mailparser").MailParser,
        mailParser = new MailParser();

    mailParser.on('end', function(mail_object){
        transporter.sendMail(mail_object, function(error, info){
            if(error){
                logger.trace(error);
            }else{
                logger.info('Message sent: ' + info.response);
            }
        });
    });
    mailParser.write(mail);
    mailParser.end();
};