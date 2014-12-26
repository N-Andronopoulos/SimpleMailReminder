/**
 *
 * @author Nikolas Andronopoulos
 * @version 0.1.0
 */

var config = require("./config.json");
var moveMailService = require("./findProcessMoveMail.js");

moveMailService.init(config);

