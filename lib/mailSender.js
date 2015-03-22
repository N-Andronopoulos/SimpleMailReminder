/**
 * Created by Nikolas on 28/12/2014.
 * @version 0.0.2
 * @author Nikolas Andronopoulos
 * @description This lib sends an email via smtp.
 */

'use strict';

/**
 * @type {exports}
 */
var loginInfo = require('../config/real-info.json');

/**
 * This function sends a mail.
 * @param {logger} logger The logger.
 * @param {json} mail The mail to be send.
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