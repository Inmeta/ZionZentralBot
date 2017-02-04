var builder = require('botbuilder');

exports.newGroup = [
  function (session) {
    builder.Prompts.text(session, "Good. What would you like to call this group?");
  },
  function (session, results) {
      // We'll save the users name and send them an initial greeting. All 
      // future messages from the user will be routed to the root dialog.

      // Set groupname variable
      var groupName = results.response;
      
      // === Sets groupname in SP-list ===

      session.send('I have created the group "%s".', groupName);
      session.endDialog('Is there anything else I could help you with?');
  }
];