/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.1.0
 */

var config = require("./config/config.json");
var loginInfo = require('./config/real-info.json');
var moveMailService = require("./lib/findProcessMoveMail.js");

moveMailService.init(loginInfo, config);

