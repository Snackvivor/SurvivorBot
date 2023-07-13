//====================================================================================================================
//  Discord Survivor Bot 
//  Author: Fish
//  Version: 1.0.0
//====================================================================================================================

/* ====================================================================================================================
 *
 *  Imports & Globals
 * 
 * ====================================================================================================================
 */

// Import discord.js and setup client requirements
const { Client, GatewayIntentBits, EmbedBuilder, CategoryChannel, PermissionsBitField, ChannelType, AttachmentBuilder, Attachment, DiscordAPIError } = require('discord.js'); //import discord.js
const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
	]
});

// Imports to keep hiroku from commiting self kill
const express = require('express')
const https = require("https")
const app = express()

// Channel IDs
const questionApprovalID = "1129133084957229208"
const confessionalCategoryID = "1125434619261620364"
const productionID = "1120827550873174127"
const superSpecRoleID = "1125270756746600509"
const preJuryRoleID = "1121857782656798751"
const castawayID = "1125270674320130078"
const submissionCategoryId = "1129132595989463100"
const everyoneId = "1117617213613023362"
const botUserTag = "SmORGonTemp#8919"

// Heroku URL
var herokuUrl = process.env.HEROKU_URL

/* ====================================================================================================================
 *
 *  App Listeners
 * 
 * ====================================================================================================================
 */

var port = process.env.PORT || 3000

app.listen(port, function(err) {
    console.log("Server listening on port:", port)
    if(err) {
        console.log("Error in server setup:", err)
    }
})

app.get('/', (req, res) => {
    res.send("Success!")
})

/* ====================================================================================================================
 *
 *  Client Listeners
 * 
 * ====================================================================================================================
 */

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(intervalFunc, 60000);
});

// ====================================================================================================================

client.on('messageCreate', async msg => {

    var staffCheck = await isStaff(msg)
    var castowayOrStaffCheck = await isCastawayOrStaff(msg)

    // If a question is sent in go to the ask question logic
    if (msg.content.startsWith("!ask")){
        askQuestionToQuestionChannel(msg)
    }

    // Create a confessional for every listed player role
    else if(msg.content.startsWith("!create-conf")){
        if(staffCheck) {
            createConfessionals(msg)
        }
    }

    // Create a submission channel for every listed player role
    else if(msg.content.startsWith("!create-subs")){
        if(staffCheck) {
            createSubs(msg)
        }
    }

    // Create one on ones for every player
    else if(msg.content.startsWith("!create-ones")){
        if(staffCheck) {
            createOneOnOnes(msg)
        }
    }

    // Create alliances for players
    else if(msg.content.startsWith("!alliance")){
        if(castowayOrStaffCheck) {
            createAlliance(msg)
        }
    }

    // Create voice chat for players
    else if(msg.content.startsWith("!vc")){
        if(castowayOrStaffCheck) {
            createVC(msg)
        }
    }

    // Send a message about what the bot can do to non-staff
    else if(msg.content == "!bot-help") {
        if(staffCheck) {

            msg.reply(`Available commands:

!bot-help
Sends this help message :)

!alliance <@tribe> <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates an alliance with the specified members for the specified tribe - The tribe role is needed to ensure that players don't create an alliance for people in other tribes

!vc <@tribe> <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates an voice chat with the specified members for the specified tribe - The tribe role is needed to ensure that players don't create an alliance for people in other tribes

!ask <@playerRole1> <@playerRole2> ... <@playerRoleX> <message>
Players can ask questions which are sent to a channel specified by ID (which is a hardcoded ID that can be changed) which will then have a thumbs up or thumbs down. 
If thumbs up send the message to the players who were @'d then delete the message in the question channel. If thumbs down, just delete the message. 
Player role includes Jury, if the jury role is titled as Jury it will look for a channel called ponderosa to ask.
`)
        }
    }

    // Send a message about what the bot can do to staff
    else if(msg.content == "!mod-help") {
        if(staffCheck) {

            msg.reply(`Available commands:

!mod-help
Sends this help message :)

!create-ones <categoryID> <@playerRole1> <@playerRole2> ... <@playerRoleX>
Create one-on-ones between the listed players in a specific category. Does not create duplicates!

!create-conf <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates all listed players confessionals with the correct permissions.

!create-subs <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates all listed players submissions with the correct permissions.

!conf-all <message>
Sends a message (or imageURL) to all players confessionals.

!conf-alive <message>
Sends a message (or imageURL) to all living players confessionals.

!conf-dead <message>
Sends a message (or imageURL) to all dead players confessionals.

!conf-tribe <@tribeRole> <message>
Sends a message (or imageURL) to a specified tribe's player's confessionals.

!conf-specific <@playerRole1> <@playerRole2> ... <@playerRoleX> <message>
Sends a message (or imageURL) to specified players confessionals.

!alliance <@tribe> <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates an alliance with the specified members for the specified tribe - The tribe role is needed to ensure that players don't create an alliance for people in other tribes

!vc <@tribe> <@playerRole1> <@playerRole2> ... <@playerRoleX>
Creates an voice chat with the specified members for the specified tribe - The tribe role is needed to ensure that players don't create an alliance for people in other tribes

!ask <@playerRole1> <@playerRole2> ... <@playerRoleX> <message>
Players can ask questions which are sent to a channel specified by ID (which is a hardcoded ID that can be changed) which will then have a thumbs up or thumbs down. 
If thumbs up send the message to the players who were @'d then delete the message in the question channel. If thumbs down, just delete the message. 
Player role includes Jury, if the jury role is titled as Jury it will look for a channel called ponderosa to ask.
`)
        }
    }

    // Send a message to all confessionals, alive and dead
    else if(msg.content.startsWith("!conf-all")){
        if(staffCheck) {
            sendConfessionals(msg, "all")
        }
    }

    // Send a message to all alive confessionals
    else if(msg.content.startsWith("!conf-alive")){
        if(staffCheck) {
            sendConfessionals(msg, "alive")
        }
    }

    // Send a message to all alive confessionals
    else if(msg.content.startsWith("!conf-dead")){
        if(staffCheck) {
            sendConfessionals(msg, "dead")
        }
    }

    // Send a message to specific confessionals
    else if(msg.content.startsWith("!conf-specific")){
        if(staffCheck) {
            sendConfessionals(msg, "specific")
        }
    }

    // Send a message to tribe specific confessionals
    else if(msg.content.startsWith("!conf-tribe")){
        if(staffCheck) {
            sendConfessionals(msg, "tribe")
        }
    }

    // Once a question goes to the question answering zone, add a react for a good question and a bad question (in this case cool hands or vomit), then when it gets reacted to, if it was a vomit delete the message, if not a vomit, send the question then delete the message
    else if(msg.channel.id === questionApprovalID) {

        msg.react('🤙')
        msg.react('🤢')

        var filter = (reaction) => {
            return reaction.emoji.name === '🤙' || reaction.emoji.name === '🤢'
        };

        var collector = msg.createReactionCollector({ filter, time: 86400000 });

        collector.on('collect', async (reaction, user) => {
            if(user.tag != botUserTag){
                if(reaction.emoji.name === '🤙') {
                    sendQuestion(msg)
                    msg.delete()
                }
                else if(reaction.emoji.name === '🤢') {
                    msg.delete()
                }
            }
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        });

    }

})

/* ====================================================================================================================
 *
 *  Background Functions
 * 
 * ====================================================================================================================
 */

async function createOneOnOnes(msg) {

    try {
        
        // Get the question and split it by spaces, then take out the !ask part
        await msg.guild.members.fetch()
        var onesCommand = msg.content.split(" ")
        onesCommand.shift()
        var categoryID = onesCommand[0]
        onesCommand.shift()

        // Sort the list of roles
        onesCommand.sort((name1, name2) => { 
            var playerARoleId = name1.substring(3, name1.length - 1)
            var playerARoleName = msg.guild.roles.cache.get(playerARoleId).name
            playerARoleName = getNameFromRole(playerARoleName)
            var playerBRoleId = name2.substring(3, name2.length - 1)
            var playerBRoleName = msg.guild.roles.cache.get(playerBRoleId).name
            playerBRoleName = getNameFromRole(playerBRoleName)
            if(playerARoleName < playerBRoleName) {
                return -1
            }
            else if(playerARoleName > playerBRoleName) {
                return 1
            }
            else {
                return 0
            }
        })

        // For each role in the list of roles create a channel
        for(var x = 0; x < onesCommand.length; x++) {
            var counter = x
            var playerARoleId = onesCommand[x].substring(3, onesCommand[x].length - 1)
            var playerARoleName = msg.guild.roles.cache.get(playerARoleId).name
            playerARoleName = getNameFromRole(playerARoleName)
            while(onesCommand[counter+1] != null) {
                var playerBRoleId = onesCommand[counter+1].substring(3, onesCommand[counter+1].length - 1)
                var playerBRoleName = msg.guild.roles.cache.get(playerBRoleId).name
                playerBRoleName = getNameFromRole(playerBRoleName)
                var channelName = playerARoleName + "-" + playerBRoleName
                counter = counter + 1
                if(!msg.guild.channels.cache.find(channel => channel.name === channelName)) {
                    try {
                        msg.guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: categoryID, permissionOverwrites: [
                            {
                                id: superSpecRoleID,
                                allow: [PermissionsBitField.Flags.ViewChannel],
                                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                            },
                            {
                                id: everyoneId,
                                deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                            },
                            {
                                id: preJuryRoleID,
                                allow: [PermissionsBitField.Flags.ViewChannel],
                                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                            },
                            {
                                id: playerARoleId,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions],
                            },
                            {
                                id: playerBRoleId,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions],
                            },],
                        })
                    } catch (error) {
                        console.log("")
                        console.log("There was an issue with the channel creation step for One on Ones:\n")
                        console.log(error)
                        console.log("")
                        msg.reply("Failure during the create one-on-ones action - Please check the logs!")
                    }
                }
            }

        }

    } catch (error) {
        console.log("")
        console.log("CreateOneOnOnes failed to properly execute:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to create One-on-Ones - Please check the logs!")
    }

}

// ====================================================================================================================

async function createSubs(msg) {

    try {
        
        // Get the question and split it by spaces, then take out the !ask part
        await msg.guild.members.fetch()
        var subCommand = msg.content.split(" ")
        subCommand.shift()
        
        for(var x = 0; x < subCommand.length; x++) {
            try {
                var roleId = subCommand[x].substring(3, subCommand[x].length - 1)
                var roleName = msg.guild.roles.cache.get(roleId).name
                roleName = getNameFromRole(roleName)
                var currChannel = roleName.toLowerCase() + "-submission"
                msg.guild.channels.create({ name: currChannel, type: ChannelType.GuildText, parent: submissionCategoryId, permissionOverwrites: [
                    {
                        id: everyoneId,
                        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                    },
                    {
                        id: roleId,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions],
                    },],
                })
            } catch (error) {
                console.log("")
                console.log("There was an issue with the channel creation step for Submissions:\n")
                console.log(error)
                console.log("")
                msg.reply("Failure during the create submissions action - Please check the logs!")
            }
        }

    } catch (error) {
        console.log("")
        console.log("CreateSubmissions failed to properly execute:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to create submissions - Please check the logs!")
    }

}

// ====================================================================================================================

async function createConfessionals(msg) {

    try {
        
        // Get the question and split it by spaces, then take out the !ask part
        await msg.guild.members.fetch()
        var confCommand = msg.content.split(" ")
        confCommand.shift()
        
        for(var x = 0; x < confCommand.length; x++) {
            try {
                var roleId = confCommand[x].substring(3, confCommand[x].length - 1)
                var roleName = msg.guild.roles.cache.get(roleId).name
                roleName = getNameFromRole(roleName)
                var currChannel = roleName.trim().replace(/\s+/g, '-').toLowerCase() + "-confessional"
                msg.guild.channels.create({ name: currChannel, type: ChannelType.GuildText, parent: confessionalCategoryID, permissionOverwrites: [
                    {
                        id: superSpecRoleID,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                    },
                    {
                        id: preJuryRoleID,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                    },
                    {
                        id: everyoneId,
                        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
                    },
                    {
                        id: roleId,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions],
                    },],
                })
            } catch (error) {
                console.log("")
                console.log("There was an issue with the channel creation step for Confessionals:\n")
                console.log(error)
                console.log("")
                msg.reply("Failure during the create confessionals action - Please check the logs!")
            }
        }

    } catch (error) {
        console.log("")
        console.log("CreateConfessionals failed to properly execute:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to create confessionals - Please check the logs!")
    }

}

// ====================================================================================================================

async function createAlliance(msg) {

    try {

        await msg.guild.members.fetch()

        // Get the player role of the author of the message
        var allianceAuthor = msg.guild.members.cache.get(msg.author.id)
        var allianceAuthorName = allianceAuthor.nickname ? allianceAuthor.nickname : allianceAuthor.user.username
        var allianceCreatorPlayerRole = allianceAuthor.roles.cache.find(role => role.name.includes(allianceAuthorName))
        
        // Get the question and split it by spaces, then take out the !ask part
        var allianceCommand = msg.content.split(" ")
        allianceCommand.shift()

        // Get the tribe role and the name of the category for the tribe alliances
        var tribeRoleId = allianceCommand.shift()
        tribeRoleId = tribeRoleId.substring(3, tribeRoleId.length - 1)
        var tribeRole = msg.guild.roles.cache.get(tribeRoleId)
        var tribeCategoryName = tribeRole.name.split(" ")[0].trim() + " Alliances"

        // Check to see if user included themselves
        var doesAllyExist = false
        var staffCheck = await isStaff(msg)
        if(!staffCheck) {
            for(var x = 0; x < allianceCommand.length; x++) {
                var currentAllyInAllianceCommand = allianceCommand[x].substring(3, allianceCommand[x].length - 1)
                var currentAllyInAllianceCommandRole = msg.guild.roles.cache.get(currentAllyInAllianceCommand)
                if(allianceCreatorPlayerRole.name == currentAllyInAllianceCommandRole.name) {
                    doesAllyExist = true
                    break
                }
            }
        }
        else {
            doesAllyExist = true
        }

        // If user did not include themselves, add them
        var whoToAlly = []
        if(!doesAllyExist) {

            // This is a playerRole, we need to first get the player with that role to see if they are also part of the tribe
            var authorAlly = allianceCreatorPlayerRole.members

            // Once you have found the single member of the role, fetch that players information
            var authorKeys = authorAlly.keys()
            var authorPlayerID = authorKeys.next().value
            var authorPlayer = msg.guild.members.cache.get(authorPlayerID)

            // Now that you have the player, check to see if they are in the tribeRole that was specified!
            var authorHasTribeRole = authorPlayer.roles.cache.some(role => role.name == tribeRole.name)
            if(!authorHasTribeRole){
                msg.reply(getNameFromRole(allianceCreatorPlayerRole.name) + " is not a part of the " + tribeRole.name + " tribe!")
                return
            }

            whoToAlly.push(allianceCreatorPlayerRole)

        }

        // For the remaining people included, see if they are actually in the tribe, if so add them to the list
        var counter = 0
        while(allianceCommand[counter] != null) {
            
            // This is a playerRole, we need to first get the player with that role to see if they are also part of the tribe
            var currAllyRoleId = allianceCommand[counter].substring(3, allianceCommand[counter].length - 1)
            var currAllyRole = msg.guild.roles.cache.get(currAllyRoleId)
            var currAlly = currAllyRole.members
            
            // Once you have found the single member of the role, fetch that players information
            var keys = currAlly.keys()
            var currPlayerID = keys.next().value
            var currPlayer = msg.guild.members.cache.get(currPlayerID)
            
            // Now that you have the player, check to see if they are in the tribeRole that was specified!
            var hasTribeRole = currPlayer.roles.cache.some(role => role.name == tribeRole.name)
            if(!hasTribeRole){
                msg.reply(getNameFromRole(currAllyRole.name) + " is not a part of the " + tribeRole.name + " tribe!")
                return
            }
            
            whoToAlly.push(currAllyRole)
            counter += 1

        }

        // Sort the list of roles
        whoToAlly.sort((name1, name2) => { 
            var playerARoleName = name1.name.toLowerCase().trim()
            var playerBRoleName = name2.name.toLowerCase().trim()
            if(playerARoleName < playerBRoleName) {
                return -1
            }
            else if(playerARoleName > playerBRoleName) {
                return 1
            }
            else {
                return 0
            }
        })

        // Getting the name of the channel
        var channelName = ""
        whoToAlly.forEach(ally => {
            channelName = channelName + getNameFromRole(ally.name) + "-"
        })
        channelName = channelName.substring(0, channelName.length - 1).toLowerCase().trim()

        try {

            // Get the category for the alliance
            var allianceCategory = msg.guild.channels.cache.find(category => category.name.toLowerCase() === tribeCategoryName.toLowerCase())
            var allianceCategoryId = allianceCategory.id

            // Creating the overwrite permissions list
            var overwriteList = []
            overwriteList.push({
                id: superSpecRoleID,
                allow: [PermissionsBitField.Flags.ViewChannel],
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
            })
            overwriteList.push({
                id: preJuryRoleID,
                allow: [PermissionsBitField.Flags.ViewChannel],
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
            })
            overwriteList.push({
                id: everyoneId,
                deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
            })
            whoToAlly.forEach(ally => {
                overwriteList.push({
                    id: ally.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions],
                })
            })

            // If the category for the alliance exists
            if(allianceCategory) {

                // If the channel does not already exists in that tribe
                var channelExists = msg.guild.channels.cache.some(channel => channel.name === channelName )
                if(!channelExists) {
                    // Create the channel
                    msg.guild.channels.create({ name: channelName, topic: channelName, type: ChannelType.GuildText, parent: allianceCategoryId, permissionOverwrites: overwriteList })
                }

            }

        } catch (error) {
            console.log("")
            console.log("There was an issue with the channel creation step for Alliances:\n")
            console.log(error)
            console.log("")
            msg.reply("Failed to create alliance - Please contact production!")
        }

    } catch (error) {
        console.log("")
        console.log("CreateAlliances failed to properly execute:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to create alliance - Please contact production!")
    }

}

// ====================================================================================================================

async function createVC(msg) {

    try {

        await msg.guild.members.fetch()

        // Get the player role of the author of the message
        var allianceAuthor = msg.guild.members.cache.get(msg.author.id)
        var allianceAuthorName = allianceAuthor.nickname ? allianceAuthor.nickname : allianceAuthor.user.username
        var allianceCreatorPlayerRole = allianceAuthor.roles.cache.find(role => role.name.includes(allianceAuthorName))  
        
        // Get the question and split it by spaces, then take out the !ask part
        var allianceCommand = msg.content.split(" ")
        allianceCommand.shift()

        // Get the tribe role and the name of the category for the tribe alliances
        var tribeRoleId = allianceCommand.shift()
        tribeRoleId = tribeRoleId.substring(3, tribeRoleId.length - 1)
        var tribeRole = msg.guild.roles.cache.get(tribeRoleId)
        var tribeCategoryName = tribeRole.name.split(" ")[0].trim() + " Alliances"

        // Check to see if user included themselves
        var doesAllyExist = false
        var staffCheck = await isStaff(msg)
        if(!staffCheck) {
            for(var x = 0; x < allianceCommand.length; x++) {
                var currentAllyInAllianceCommand = allianceCommand[x].substring(3, allianceCommand[x].length - 1)
                var currentAllyInAllianceCommandRole = msg.guild.roles.cache.get(currentAllyInAllianceCommand)
                if(allianceCreatorPlayerRole.name == currentAllyInAllianceCommandRole.name) {
                    doesAllyExist = true
                    break
                }
            }
        }
        else {
            doesAllyExist = true
        }

        // If user did not include themselves, add them
        var whoToAlly = []
        if(!doesAllyExist) {

            // This is a playerRole, we need to first get the player with that role to see if they are also part of the tribe
            var authorAlly = allianceCreatorPlayerRole.members

            // Once you have found the single member of the role, fetch that players information
            var authorKeys = authorAlly.keys()
            var authorPlayerID = authorKeys.next().value
            var authorPlayer = msg.guild.members.cache.get(authorPlayerID)

            // Now that you have the player, check to see if they are in the tribeRole that was specified!
            var authorHasTribeRole = authorPlayer.roles.cache.some(role => role.name == tribeRole.name)
            if(!authorHasTribeRole){
                msg.reply(getNameFromRole(allianceCreatorPlayerRole.name) + " is not a part of the " + tribeRole.name + " tribe!")
                return
            }

            whoToAlly.push(allianceCreatorPlayerRole)

        }

        // For the remaining people included
        var counter = 0
        while(allianceCommand[counter] != null) {
            
            // This is a playerRole, we need to first get the player with that role to see if they are also part of the tribe
            var currAllyRoleId = allianceCommand[counter].substring(3, allianceCommand[counter].length - 1)
            var currAllyRole = msg.guild.roles.cache.get(currAllyRoleId)
            var currAlly = currAllyRole.members
            
            // Once you have found the single member of the role, fetch that players information
            var keys = currAlly.keys()
            var currPlayerID = keys.next().value
            var currPlayer = msg.guild.members.cache.get(currPlayerID)
            
            // Now that you have the player, check to see if they are in the tribeRole that was specified!
            var hasTribeRole = currPlayer.roles.cache.some(role => role.name == tribeRole.name)
            if(!hasTribeRole){
                msg.reply(getNameFromRole(currAllyRole.name) + " is not a part of the " + tribeRole.name + " tribe!")
                return
            }
            
            whoToAlly.push(currAllyRole)
            counter += 1

        }

        // Sort the list of roles
        whoToAlly.sort((name1, name2) => { 
            var playerARoleName = name1.name.toLowerCase().trim()
            var playerBRoleName = name2.name.toLowerCase().trim()
            if(playerARoleName < playerBRoleName) {
                return -1
            }
            else if(playerARoleName > playerBRoleName) {
                return 1
            }
            else {
                return 0
            }
        })

        // Getting the name of the channel
        var channelName = ""
        whoToAlly.forEach(ally => {
            channelName = channelName + getNameFromRole(ally.name) + "-"
        })
        channelName = channelName.substring(0, channelName.length - 1).toLowerCase().trim() + "-vc"

        try {

            // Get the category for the alliance
            var allianceCategory = msg.guild.channels.cache.find(category => category.name.toLowerCase() === tribeCategoryName.toLowerCase())
            var allianceCategoryId = allianceCategory.id

            // Creating the overwrite permissions list
            var overwriteList = []
            overwriteList.push({
                id: superSpecRoleID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.RequestToSpeak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseEmbeddedActivities]
            })
            overwriteList.push({
                id: preJuryRoleID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.RequestToSpeak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseEmbeddedActivities]
            })
            overwriteList.push({
                id: everyoneId,
                deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendMessagesInThreads, PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.CreatePrivateThreads]
            })
            whoToAlly.forEach(ally => {
                overwriteList.push({
                    id: ally.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.RequestToSpeak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseEmbeddedActivities, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AddReactions]
                })
            })

            // If the category for the alliance exists
            if(allianceCategory) {
                // If the channel does not already exists in that tribe
                var channelExists = msg.guild.channels.cache.some(channel => channel.name === channelName )
                if(!channelExists) {
                    // Create the channel
                    msg.guild.channels.create({ name: channelName, topic: channelName, type: ChannelType.GuildVoice, parent: allianceCategoryId, permissionOverwrites: overwriteList })
                }
            }

        } catch (error) {
            console.log("")
            console.log("There was an issue with the channel creation step for VCs:\n")
            console.log(error)
            console.log("")
            msg.reply("Failed to create VC - Please contact production!")
        }

    } catch (error) {
        console.log("")
        console.log("CreateVCs failed to properly execute:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to create VC - Please contact production!")
    }

}

// ====================================================================================================================

async function askQuestionToQuestionChannel(msg) {

    try {
        
        // Get the question and split it by spaces, then take out the !ask part
        var question = msg.content.split(" ")
        question.shift()

        // Get the list of people the question is being asked to
        var counter = 0
        var whoToAsk = []
        while(question[counter].includes("<@&")){
            whoToAsk.push(question[counter])
            counter += 1
        }

        // Form the rest into the message!
        var messageString = ""
        while(question[counter] != null){
            messageString += question[counter] + " "
            counter += 1
        }

        // Setup information to use for the embed!
        var author = msg.author.username + " has asked a question to..."
        var thumbnail = "https://cdn.discordapp.com/avatars/"+msg.author.id+"/"+msg.author.avatar+".jpeg"
        var title = ""
        for(var x = 0; x < whoToAsk.length; x++) { 
            var roleInfo = whoToAsk[x].substring(3, whoToAsk[x].length - 1)
            var currRole = msg.guild.roles.cache.get(roleInfo).name
            title += currRole + " "
        }

        // Create the embed and send it on it's way!
        var embed = new EmbedBuilder().setColor(0x197214).setAuthor({ name: author, iconURL: null }).setTitle(title).setDescription(messageString).setThumbnail(thumbnail)
        var askChannel = await client.channels.fetch(questionApprovalID)
        askChannel.send({ embeds: [embed] }).catch(console.error)

    } catch (error) {
        console.log("")
        console.log("There was an issue with the question being asked going to the question channel:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to generate question for approval - Please contact production!")
    }

}

// ====================================================================================================================

async function sendConfessionals(msg, location) {

    try {
        
        // Get the question and split it by spaces, then take out the !ask part
        var bannerCommand = msg.content.split(" ")
        bannerCommand.shift()

        // Determine which confessionals should be sent to - Options are: specific, tribe, all, alive, dead
        if(location != "specific" && location != "tribe") {

            // Form the rest into the message!
            var messageString = ""
            var counter = 0
            while(bannerCommand[counter] != null){
                messageString += bannerCommand[counter] + " "
                counter += 1
            }
            messageString = messageString.trim()            

            var confessionalsList = await msg.guild.channels.fetch(confessionalCategoryID)
            confessionalsList = confessionalsList.children.cache

            // For each confessional send to specific channels depending on if they are alive, dead or everyone
            confessionalsList.each(currChannel => {
                
                var id = msg.guild.channels.cache.find(channel => channel.id === currChannel.id)
                var name = currChannel.name

                if(location == "alive") {
                    if(Number((name.match(/-/g) || []).length) == 1) {
                        if(name.includes("confessional")){ 
                            id.send(messageString).catch(console.error)
                        }
                    }
                } else if (location == "dead") {
                    if(Number((name.match(/-/g) || []).length) > 1) {
                        if(name.includes("confessional")){ 
                            id.send(messageString).catch(console.error)
                        }
                    }
                } else if (location == "all") {
                    if(name.includes("confessional")){ 
                        id.send(messageString).catch(console.error)
                    }
                }

            })

        } 

        // Determine which confessionals should be sent to based on specific player or tribe
        else {

            // Get the list of people the question is being asked to
            whoToAsk = []
            var counter = 0
            while(bannerCommand[counter].includes("<@&")) {
                whoToAsk.push(bannerCommand[counter])
                counter += 1
            }

            // Form the rest into the message!
            var messageString = ""
            while(bannerCommand[counter] != null){
                messageString += bannerCommand[counter] + " "
                counter += 1
            }
            messageString = messageString.trim()

            // If it's sent to a specific tribe, for each member send the message
            if(location == "tribe") {

                await msg.guild.members.fetch()
                var roleInfo = whoToAsk[0].substring(3, whoToAsk[0].length - 1)
                var tribeMembers = await msg.guild.roles.fetch(roleInfo)
                tribeMembers = tribeMembers.members

                // For each member of the tribe send the message
                tribeMembers.each(member => {
                    try {
                        var name = member.nickname ? member.nickname : member.user.username
                        var currChannel = name.trim().replace(/\s+/g, '-').toLowerCase() + "-confessional"
                        var id = msg.guild.channels.cache.find(channel => channel.name === currChannel)
                        id.send(messageString).catch(console.error)
                    } catch (error) {
                        console.log("")
                        console.log("There was an issue with sending a message to the confessional of some member of a specific tribe:\n")
                        console.log(error)
                        console.log("")
                        msg.reply("Failed to send message one or more members of the tribe!")
                    }
                })

            } 
            
            // If it's sent to specific players, for each player send the message
            else if (location == "specific") {
            
                // For each specific player get the channel and send the message to it
                for(var x = 0; x < whoToAsk.length; x++) {

                    var roleInfo = whoToAsk[x].substring(3, whoToAsk[x].length - 1)
                    var currRole = await msg.guild.roles.fetch(roleInfo)
                    var playerName = getNameFromRole(currRole.name)
                    var currChannel = ""

                    if(playerName == "Jury") {
                        currChannel = "ponderosa"
                    } 
                    else {
                        currChannel = playerName + "-confessional"
                    }

                    var id = msg.guild.channels.cache.find(channel => channel.name === currChannel)
                    id.send(messageString).catch(console.error)

                }
            }
        }

    } catch (error) {
        console.log("")
        console.log("There was an issue with sending a message to some confessional:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to send message one or more confessionals!")
    }

}

// ====================================================================================================================

function getNameFromRole(roleString) {

    var roleArrayWithEmoji = roleString.split(" ")
    var roleWithoutEmoji = ""
    roleArrayWithEmoji.pop()
    for(var x = 0; x < roleArrayWithEmoji.length; x++) {
        roleWithoutEmoji += roleArrayWithEmoji[x].trim().toLowerCase() + "-"
    }
    roleWithoutEmoji = roleWithoutEmoji.substring(0, roleWithoutEmoji.length - 1).trim().toLowerCase()
    return roleWithoutEmoji
    
}

// ====================================================================================================================

async function sendQuestion(msg) {

    try {

        // Get a list of the people to send questions to
        var channelsToSend = msg.embeds[0].title.split(" ")
        var finalChannelList = []
        var regex = /[\u{1F600}-\u{1F64F}\u{1F910}-\u{1F96B}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu
        var currString = ""

        // Remove the emojis if not jury
        for(var y = 0; y < channelsToSend.length; y++) {
            if(channelsToSend[y] != "Jury") { 
                if(!regex.test(channelsToSend[y])) {
                    currString += channelsToSend[y] + "-"
                }
                else {
                    finalChannelList.push(currString.substring(0, currString.length - 1))
                    currString = ""
                }
            } 
            // Adds the Jury only to the final channel list
            else {
                finalChannelList.push(channelsToSend[y])
            }
        }

        // For each person, find their confessional channel and update the embed to make it look individual even when it isn't, then send that bitch on out
        for(var x = 0; x < finalChannelList.length; x++) {

            try {

                var playerName = finalChannelList[x]
                var currChannel = ""
                if(playerName == "Jury") {
                    currChannel = "ponderosa"
                } else {
                    currChannel = playerName.toLowerCase() + "-confessional"
                }
                var id = msg.guild.channels.cache.find(channel => channel.name === currChannel)
                var currEmbed = new EmbedBuilder(msg.embeds[0])
                currEmbed.setTitle(playerName.replace(/-/g, ' '))
                id.send({embeds: [currEmbed]}).catch(console.error)

            } catch (sendError) {
                console.log("")
                console.log("Sending question to confessional failed: ")
                console.log(sendError)
                console.log("")
                msg.reply("Failed to send question to one or more confessionals!")
            }

        }

    } catch (error) {
        console.log("")
        console.log("There was an issue sending the approved question to one of the listed confessionals:\n")
        console.log(error)
        console.log("")
        msg.reply("Failed to send question to one or more confessionals!")
    }

}

// ====================================================================================================================

async function isStaff(msg) {

    if(msg.author.bot) {
        return true
    }

    try {
        await msg.guild.members.fetch()
        var hasRole = await msg.member.roles.cache.has(productionID)
        return hasRole
    } catch (error) {
        console.log(error)
        return false
    }

}

// ====================================================================================================================

async function isCastawayOrStaff(msg) {

    if(msg.author.bot) {
        return true
    }

    try {
        await msg.guild.members.fetch()
        var isCastaway = await msg.member.roles.cache.has(castawayID)
        var isProduction = await msg.member.roles.cache.has(productionID)
        if(isCastaway || isProduction) {
            return true
        }
        return false
    } catch (error) {
        console.log(error)
        return false
    }

}

// ====================================================================================================================

function intervalFunc() {
    https.get(herokuUrl);
}

/* ====================================================================================================================
 *
 *  Client Login (MUST GO LAST)
 * 
 * ====================================================================================================================
 */

client.login(process.env.TOKEN)
