// TODO: Implement regex expression with 'fight'. Mr. Smith respons: Are you currently located at [location]?
// User answers no: Are you lying to me Mr. Anderson? If you are; this is what I will do to you: [Gif of Mr. Smith]
var request = require('request-promise');
var restify = require('restify');
var builder = require('botbuilder');
var pnp = require("sp-pnp-js");
var http = require('http');
var getAuthHeaders = require('./SPHelper');
var config = require('./SPHelper/config');

var spauth = require('node-sp-auth');

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
    session.send("What can I do for you? Say 'help' to see available commands...");
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
        session.userData.version = 1.0;

        // === Get username from SP and set it to var userName ===
        var userName = 'Mr. Anderson';

        session.userData.name = userName;

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
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.send("Creating group. What else can I do for you?");
        // Set groupname variable
        var groupName = results.response;
        spauth
        .getAuth('https://inmetademo.sharepoint.com/sites/ASPC2017/', {
            clientId: '3512acc4-e351-4f05-ab44-096f5feb5be0',
            clientSecret: 'QZPey6+/314bIM5i7JnKKI4Ufwtiv45EDgJb8QXvOUQ=',
            realm: '3d3bcaba-4686-474f-bdd3-010b8047ccc6'
        })
        .then(function (data) {
            var headers = data.headers;
            headers['Accept'] = 'application/json;odata=verbose';

            request.post({
                url: "https://inmetademo.sharepoint.com/sites/ASPC2017/_api/web/webinfos/add",
                headers: headers,
                json: true,
                body: {
                    'parameters': {
                        /*'__metadata': {
                            'type': 'SP.WebInfoCreationInformation'
                        },*/
                        'Url': groupName,
                        'Title': groupName,
                        'Description': '',
                        'Language': 1033,
                        'WebTemplate': 'sts',
                        'UseUniquePermissions': false
                    }
                },
            }).then(function (response) {
                console.log(response,null,2);
                session.send('By the way, the group %s is ready',groupName);
                var link = "[Sharepoint group location](http://inmetademo.sharepoint.com" + response.d.ServerRelativeUrl + ")";
                
                session.send('You can visit it at: %s', link);
            });
            session.endDialog();
        });        
        // === Sets groupname in SP-list ===
    }
]).triggerAction({ matches: /^.*new group.*/i });

// Add new_mission dialog
bot.dialog('new_mission', [function (session) {
    builder.Prompts.text(session, "A new mission, eh? What should we call this mission?");
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.

        // Set groupname variable
        session.dialogData.missionName = results.response;
        
        session.send("I will get the available groups...");

        var rebels = [];
        // Get Rebels
        getAuthHeaders().then(function(headers){
            pnp.setup({ headers: headers });
            
            var web = new pnp.Web("https://inmetademo.sharepoint.com/sites/ASPC2017");
            web.lists.getByTitle('Rebels').items.select("Title").get().then(function (resRebels) {
                rebels = resRebels.map(function(rebel) {
                    return rebel.Title
                })
                        
                builder.Prompts.choice(session, "Which group should be assigned to the "+ session.dialogData.missionName +" mission?", rebels);

            }).catch(function(e) {
                console.log(e);
            });

        })
        // === Sets new mission in SP-list ====

        // === Get existing groups from SP-list ====
        // var availableGroups = ['Taskforce 1', 'Red rabbits', 'The spotted pants'];

        
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        // Set meta variable
        var missionName = session.dialogData.missionName;
        var assignedGroup = results.response.entity;
        session.dialogData.assignedGroup = assignedGroup;
        // === Sets group to mission in SP-list ===

        session.send("We are creating a new mission " + missionName + " for group " + session.dialogData.assignedGroup);
        spauth
        .getAuth('https://inmetademo.sharepoint.com/sites/ASPC2017/', {
            clientId: '3512acc4-e351-4f05-ab44-096f5feb5be0',
            clientSecret: 'QZPey6+/314bIM5i7JnKKI4Ufwtiv45EDgJb8QXvOUQ=',
            realm: '3d3bcaba-4686-474f-bdd3-010b8047ccc6'
        })
        .then(function (data) {
            var headers = data.headers;
            headers['Accept'] = 'application/json;odata=verbose';

            request.post({
                url: "https://inmetademo.sharepoint.com/sites/ASPC2017/_api/web/lists/getByTitle('Missions')/items",
                headers: headers,
                json: true,
                body: {
                    'Title': missionName,
                    'Group': assignedGroup,
                    'Mission_x0020_Location': "59.8939525,10.6446925"
                },
            }).then(function (response) {
                session.endDialog('Good luck Mr. A.  \n "%s" group is on mission "%s".', assignedGroup, missionName);
            });
        });
        
    }
]).triggerAction({ matches: /^.*new mission.*/i });

// Add mission_status dialog
bot.dialog('mission_status', [function (session) { 

    var missions = [];
    session.dialogData.missions = [];
    // Get Rebels
    getAuthHeaders().then(function(headers){
        pnp.setup({ headers: headers });
        
        var web = new pnp.Web("https://inmetademo.sharepoint.com/sites/ASPC2017");
        web.lists.getByTitle('Missions').items.select("Title, Status").get().then(function (resMissions) {
            session.dialogData.resMissions = resMissions;
            session.dialogData.missions = resMissions.map(function(mision) {
                return mision.Title
            })
                    
            builder.Prompts.choice(session, "Which mission would you like to see status for? ", session.dialogData.missions);

        }).catch(function(e) {
            console.log(e);
        });

    })
    },
    function (session, results) {
        // Set groupname variable
        var selectedMission = results.response.entity;
        var currentMission = session.dialogData.resMissions.find(function(mission) {
            return mission.Title === selectedMission
        })
        // === Make call to SP to get mission status ===
        var missionStatus = currentMission.Status;
        session.endDialog('Mission status for "%s": %s', selectedMission, missionStatus);
    }
]).triggerAction({ matches: /^.*mission status.*/i });

// Add thank you dialog
bot.dialog('thank_you', function (session) {
    session.endDialog("You're welcome.");
}).triggerAction({ matches: /^.*thank you.*/i });

// Add give me the answer dialog
bot.dialog('answer_to_everything', function (session) {
    session.endDialog("42");
}).triggerAction({ matches: /^.*answer to everything.*/i });

// Add help dialog
bot.dialog('help', function (session) {
    session.send("Here's a list of what I can help you with, %s:", session.userData.name);
    session.endDialog("[new group] - To create a new Rebel Group  \n [new mission] - To create a new mission  \n [mission status] - To get mission status");
}).triggerAction({ matches: /^.*help.*/i });

// Sends a get request the robot api, which commands the robot
var alertRobot = function() {
    console.log('Creating a simple HTTP request');

    http.get("http://api.ipify.org?format=json", function(res) {
        var body = ''; // Will contain the final response
        // Received data is a buffer.
        // Adding it to our body
        res.on('data', function(data){
            body += data;
        });
        // After the response is completed, parse it and log it to the console
        res.on('end', function() {
            var parsed = JSON.parse(body);
            console.log(parsed);
        });
    })
    // If any error has occured, log error to console
    .on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

