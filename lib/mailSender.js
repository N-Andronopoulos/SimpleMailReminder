/**
 * Created by Nikolas on 28/12/2014.
 * @version 0.0.1
 * @author Nikolas Andronopoulos
 * @description This lib sends an email via smtp.
 */

var loginInfo = require('../config/real-info.json');

/**
 * This function sends a mail.
 * @param {logger} logger The logger.
 * @param {String} mail The mail to be send.
 */
exports.sendMail = function( mail, logger){
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: loginInfo.user,
            pass: loginInfo.password
        }
    });

    transporter.sendMail(mail, function(err, info){
        if(err)
            logger.error(err);
        else
            logger.info("Mail has been sent! ", info);
    });
};