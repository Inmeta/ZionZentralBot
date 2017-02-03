// TODO: Implement regex expression with 'fight'. Mr. Smith respons: Are you currently located at [location]?
// User answers no: Are you lying to me Mr. Anderson? If you are; this is what I will do to you: [Gif of Mr. Smith]

var restify = require('restify');
var builder = require('botbuilder');

//===============================================================
// Bot Setup
//===============================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("%s, I heard: %s", session.userData.name, session.message.text);
    session.send("Say 'help' or something else...");
});
server.post('/api/messages', connector.listen());

//==============================================================
// Bots Dialogs
//==============================================================

// Add first run dialog
bot.dialog('firstRun',
    function (session) {
        // Update versio number and start Prompts
        // - The version number needs to be updated first to prevent re-triggering 
        //   the dialog. 
        session.userData.version = 1.1;

        // Get username from SP and set it to var userName
        var userName = 'Mr. Anderson';

        session.userData.name = userName;
        //builder.Prompts.text(session, "Hello %s. What can I do for you?", userName);
        session.endDialog("Hello %s. What can I do for you?", userName);
    }).triggerAction({
    onFindAction: function (context, callback) {
        // Trigger dialog if the users version field is less than 1.0
        // - When triggered we return a score of 1.1 to ensure the dialog is always triggered.
        var ver = context.userData.version || 0;
        var score = ver < 1.0 ? 1.1: 0.0;
        callback(null, score);
    },
    onInterrupted: function (session, dialogId, dialogArgs, next) {
        // Prevent dialog from being interrupted.
        session.send("Sorry... We need some information from you first.");
    }
});

// Add new_group dialog
bot.dialog('new_group', [function (session) {
    builder.Prompts.text(session, "Good. What would you like to call this group?");
    //session.send("Having trouble, %s?", session.userData.name);
    //session.endDialog("I'm afraid I can't help you. My programming tells me you and I are arch enemies.");
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.

        // Set groupname variable
        var groupName = results.response;
        
        // Sets sessionvariable
        //session.userData.name = results.response;

        session.send('I have created the group "%s".', groupName);
        session.endDialog('Is there anything else I could help you with?');
    }
]).triggerAction({ matches: /^.*new group.*/i });

// Add help dialog
bot.dialog('help', function (session) {
    session.send("Here's a list of what I can help you with, %s:", session.userData.name);
    session.endDialog("[new group] - To create a new Rebel Group  \n [new mission] - To create a new mission");
}).triggerAction({ matches: /^.*help.*/i });