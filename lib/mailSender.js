/**
 * Created by Nikolas on 28/12/2014.
 * @version 0.0.1
 * @author Nikolas Andronopoulos
 * @description This lib sends an email via smtp.
 */

/**
 * The logger.
 * @param {Object} logger
 * The login information file.
 * @param {Object} loginInfo
 * The mail to be send.
 * @param {Object} mail
 */
exports.sendMail = function(logger,loginInfo,mail){
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host: loginInfo.host,
        port: loginInfo.port,
        ignoreTLS: !loginInfo.tls,
        auth:{
            user: loginInfo.user,
            pass: loginInfo.password
        }
    });

    transporter.sendMail(mail, function(error, info){
        if(error){
            logger.trace(error);
        }else{
            logger.info('Message sent: ' + info.response);
        }
    });
};