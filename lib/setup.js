/**
 * Created by Nikolas on 27/12/2014.
 * @author Nikolas Andronopoulos
 * @version 0.1.3
 * @description This program ask the user for the login information to
 * the imap server and saves it to real-info.json file under config.
 */

var config = {};
var prompt = require('prompt');
var fs = require('fs');
var path = require('path');
var configSavePath = path.join(__dirname,'..','config','real-info.json');
var asciArtLogoPath = path.join(__dirname,'..','img','logo-asci.txt');
var logsPath = path.join(__dirname,'..','logs');

console.log(fs.readFileSync(asciArtLogoPath)+'');
console.log("\n\t\t\t\tWelcome to the installer!\n" +
    "Enter the information of the imap server " +
    "you're going to be using.");
console.log("\n");
try {fs.mkdirSync(logsPath);}catch(e){}

prompt.start();

/**
 * This method JSON-ifies the the input and appends it to
 * a json file in the given dir.
 * @param {JSON} config
 * @param {String} dir
 */
var saveConfToFile = function(config, dir){
    config = JSON.stringify(config,null,'\t');
    fs.writeFileSync(dir,config);
    process.exit(0);
};

var promptConfig = { properties: {
    user: {
        description: 'Enter the username/email\n',
        type: 'string',
        hidden: false,
        required: true
    },
    password: {
        description: 'Enter your password\n',
        type: 'string',
        hidden: false,
        required: true
    },
    host: {
        description: 'Enter the address of your Imap server',
        type: 'string',
        pattern: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
        message: '\nPassword must be letters\n',
        required: true
    },
    port: {
        description: 'Enter your server\'s port number',
        type: 'string',
        pattern: /^(6553[0-5])|(655[0-2]\d)|(65[0-4]\d{2})|(6[0-4]\d{3})|([1-5]\d{4})|([1-9]\d{1,3})|(\d)$/,
        message: "\nThis is not a valid port number\n",
        default: '993',
        required: false
    },
    tls: {
        description: 'Enter true/false if you want to connect with tls encryption',
        type: 'boolean',
        default: true,
        required: false
    }
}
};

/**
 * Shows the installer.
 */
var installer = function(){
    prompt.get(promptConfig, function (err, result) {
        console.log('  Information received: ');
        console.log('  Username: ' + result.user);
        console.log('  Password: ' + result.password);
        console.log('  Imap Server: ' + result.host);
        console.log('  Server Port: ' + result.port);
        console.log('  TLS True/False: ' + result.tls);

        prompt.get({properties:{
            this: {
                description: 'Is this information ok?',
                type: 'string',
                default: 'yes',
                required: false
            }
        }},function(err, anwser){
            if(anwser.this == 'yes')
                saveConfToFile(result, configSavePath);
            else{
                console.log('\033[2J');
                installer();
            }
        });
    });
}

installer();
