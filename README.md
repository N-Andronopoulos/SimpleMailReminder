SimpleMailReminder
==================
![XKCD 970](https://sslimgs.xkcd.com/comics/the_important_field.png)

A simple imap mail reminder service based on nodejs.

##Installation
To install run:
```
npm install
```
On Ubuntu system you may need sudo
```
sudo npm install
```
And follow the installer's instructions to setup the program.
If you wish to run the installer again afterwards, just run 
the above command again.

##Consept
This service in conjunction with an IMAP server will provide a mail reminding service, where the user will send an email (eg an event newsletter) and the service to automatically send that mail X amount of days, weeks, months or more than once again. 
All the user has to do is include a tag in the subject (eg ##Remind: 1d, 1w, 3m##) along with the normal subject (eg "Next match is next month! ##Remind: 3w##") and CC the IMAP mail address dedicated to this service. 

Then this service will read the INBOX folder and look for the tag in the subjects, if found mail(s) will be moved to a new IMAP folder (default: Reminds). Then if the dates in those mail's tag is after the current, the mail(s) will be resent to the original recipients (along will CC the reminding address with tag's dates descresed).

##Usage
To start the service simply run:
```
npm start
```

The configuration for the service is located at config folder config.json.
You can change the following:
```
{
  "destinationBox": "Reminds",  //Destination for valid to-be-reminded mail in remote IMAP server
  "tagInMail": "##Remind: ",    //Tag prefix which is located the mail's subject line.
  "endTagInMail": "##",         //Tag postfix
  "serviceRepeat": "0 * * * *"  //Cron style scheduling for the service (default hourly)
}
```

