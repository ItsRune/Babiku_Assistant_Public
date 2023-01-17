const Roblox = require('noblox.js');
const Moment = require('moment');
const Discord = require('discord.js');
const { getAverageColor } = require('fast-average-color-node');
const fs = require('fs');
const path = require('path');
const EventFormat = require('../../Utils/Formats/EventFormat');
const verifModel = require('../../Mongoose/Verification');
const shiftModel = require('../../Mongoose/Shift');
const inactivityModel = require('../../Mongoose/InactivityNotices');
const CreateEmbed = require('../../Utils/Functions/CreateEmbed');
const getSettings = require('../../Utils/Functions/getSettings');
const getGroupRoles = require('../../Utils/Functions/getGroupRoles');
const { convertTimeToEST, standardTimes } = require('../../Utils/Functions/convertTimeToEST');
const bubbleSort = require('../../Utils/Functions/bubbleSort');

class Event extends EventFormat {
  constructor() {
    super('interactionCreate');
  };

  async #fetchTeamName(Member) {
    let toReturn = "";

    try {
      await Member.fetch();
      Member.roles.cache.forEach(role => {
        if (role.name.toLowerCase().includes("team")) {
          toReturn = String(role.name).split(" ")[0];
        };
      });
    } catch (error) {
      toReturn = "Unknown";
      console.error(error);
    };

    if (String(toReturn).substring(0).toLowerCase() === String(toReturn).substring(0)) {
      toReturn = String(toReturn).substring(0, 1).toUpperCase() + String(toReturn).substring(1).toLowerCase();
    };

    return toReturn;
  };

  #convertNumberToLowerNumber(num) {
    const nums = String(num).split('');
    let result = "";

    for (let i = 0; i < nums.length; i++) {
      const thisNum = Number(nums[i]);

      if (i != 0 && thisNum >= 0) {
        result += `0`;
      } else if (i == 0) {
        result += nums[i];
      };
    };

    return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  #convertFirstLetterToUppercase(string) {
    return String(string).substring(0, 1).toUpperCase() + String(string).substring(1).toLowerCase();
  };

  async run(Client, Interaction) {
    const Member = Interaction.member;
    const Id = Interaction.customId;
    const Settings = getSettings();

    if (Member) {
      if (Client.EventLimiter.take(Member.id)) return Interaction.reply({
        content: "Oh no! You've been rate limited for sending too many requests in a short period of time. Please wait a few seconds and try again.",
        ephemeral: true
      });
    };

    try {
      if (Interaction.isButton()) {
        if (Interaction.replied) return;
        const Message = Interaction.message;
        const guild = (Interaction.guild != null) ? await Interaction.guild.fetch() : null;
        const split = String(Id).split("_");

        if (Id.includes('joinverification')) {
          const option = split[1];
          const robloxId = Number(split[2]);
          const memberId = String(split[3]);
          const guildId = String(split[4]);
          const Guild = await Client.guilds.fetch(guildId);

          if (option === "yes") {
            try {
              const robloxUsername = await Roblox.getUsernameFromId(robloxId);

              const document = new verifModel({
                discordId: String(memberId),
                robloxId
              });
              await document.save();
              
              // Try-Catch due to it failing some of the time.
              try {
                await getGroupRoles(Member, Guild, robloxId, Settings.robloxGroupId);
              } catch(error) {
                console.error(error);
              };

              await Interaction.update({
                embeds: [{
                  title: `${Settings.Options.embedHeader} |  Verification`,
                  description: `Hey ${robloxUsername}, thank you for verifying! We'll update your roles shortly, but in the mean time you should check out our rules and information channel whilst you wait!`,
                  color: Message.embeds[0].color,
                  timestamp: Date.now()
                }],
                components: []
              });
            } catch (error) {
              console.error(error);
              await Interaction.update({
                embeds: [{
                  title: `${Settings.Options.embedHeader} |  Verification`,
                  color: Message.embeds[0].color,
                  description: `An error occurred whilst trying to update our database, please go to a commands channel and type \`${Client.Prefix}verify\`!`,
                  timestamp: Date.now()
                }],
                components: []
              });
            }
          } else if (option === "no") {
            const Member = await Guild.members.fetch(memberId);
            const updateInfo = await CreateEmbed(Member, `${Settings.Options.embedHeader} |  Verification`, `Alrighty, click below when you're ready to verify with us!`, null, null, null, null, null, [
              {
                Label: "Verify",
                Color: "Primary",
                ID: `verification_start_${Guild.id}_${Member.id}_${Math.random() * 1000000}`
              }
            ], null, {
              dontSend: true
            });

            await Interaction.update(updateInfo);
          };
        } else if (Id.includes('verification_start')) {
          const split = String(Id).split("_");
          const Guild = await Client.guilds.fetch(split[2]);
          const Member = await Guild.members.fetch(String(split[3]));

          const newTextInput = new Discord.TextInputComponent({
            customId: "robloxUserInput",
            label: "Please input your Roblox username:",
            style: "SHORT",
            required: true
          });

          const newMessageActionRow = new Discord.MessageActionRow().addComponents(newTextInput);
          const newModal = new Discord.Modal()
          newModal.setTitle("Verification");
          newModal.setCustomId(`verificationmodal_${Member.id}_${Guild.id}`);
          newModal.addComponents(newMessageActionRow);

          await Interaction.showModal(newModal);
        } else if (Id.includes('help')) {
          const split = Id.split("_");
          const currentPage = Number(split[1]);
          const Type = split[2];
          const currentTime = split[3];
          const currentCategory = split[4];
          const currentInteractionIndex = Number(split[5]);

          try {
            if (Date.now() - currentTime > 1_800_000) {
              return await Interaction.update({
                embeds: [{
                  title: `${Settings.Options.embedHeader} |  Help`,
                  color: Message.embeds[0].color,
                  description: `This embed has expired, please go to a commands channel and type \`${Client.Prefix}help\`!`,
                  timestamp: Date.now()
                }],
                components: []
              });
            };

            const helpCommand = Client.Commands.get('help');
            const nextPage = await helpCommand.getCategoryCommands(Client, Member, currentCategory);
            let nextPageNumber = (Type == "next") ? currentPage + 1 : currentPage - 1;

            if (nextPageNumber < 0) {
              nextPageNumber = nextPage.length - 1;
            } else if (nextPageNumber > nextPage.length - 1) {
              nextPageNumber = 0;
            };

            if (nextPageNumber == currentPage) {
              return await Interaction.reply({
                content: `There appears to be no other pages for the category ${currentCategory}.`,
                ephemeral: true
              });
            };

            const categories = await helpCommand.getCategories(Client);
            let optionData = [];

            for (let i = 0; i < categories.length; i++) {
              optionData.push({
                Label: categories[i],
                Description: helpCommand.categoryDescriptions[categories[i]],
                Value: categories[i]
              });
            };

            const nextPageCommands = nextPage[nextPageNumber];
            const useForUpdatingInteraction = await CreateEmbed(Message, `${Settings.Options.embedHeader} | Help`, 'These are all of my listed commands, note that `<>` means the parameter is required and `[]` means they\'re optional.',
              null, nextPageCommands, `${currentCategory} Page ${nextPageNumber + 1}/${nextPage.length}`, null, null, [{
                  Label: "Back",
                  Color: "SECONDARY",
                  ID: `help_${nextPageNumber}_back_${currentTime}_${currentCategory}_${currentInteractionIndex + .005}`
                },
                {
                  Label: "Next",
                  Color: "SECONDARY",
                  ID: `help_${nextPageNumber}_next_${currentTime}_${currentCategory}_${currentInteractionIndex + .01}`
                }
              ], {
                Placeholder: currentCategory,
                Options: optionData,
                ID: `help_${nextPageNumber}_none_${Date.now()}_${(Math.random() * 1000000000) + 1}_${Message.member.id}`,
                maxValues: 1
              }, {
                dontSend: true
              }
            );

            return await Interaction.update(useForUpdatingInteraction);
          } catch (error) {
            console.error(error);
            await Interaction.update({
              embeds: [{
                title: `${Settings.Options.embedHeader} |  Help`,
                color: Message.embeds[0].color,
                description: `An error occurred whilst processing this action!`,
                timestamp: Date.now()
              }],
              components: []
            });
          }
        } else if (Id.includes('inactivitynotice')) {
          const split = Id.split("_");
          const guildId = split[1];
          const memberId = split[2];
          const robloxId = split[3];

          const dateTextInput = new Discord.TextInputComponent({
            customId: "inactivityDate",
            label: "How long will you be inactive for?",
            placeholder: "Example: 07/04/2022 12 am",
            maxLength: 20,
            minLength: 4,
            style: "SHORT",
            required: true
          });

          const reasonTextInput = new Discord.TextInputComponent({
            customId: "inactivityReason",
            label: "What's the reason for your inactivity?",
            minLength: 5,
            maxLength: 1000,
            style: "PARAGRAPH",
            required: true
          });

          const reasonActionRow = new Discord.MessageActionRow().addComponents(reasonTextInput);
          const dateActionRow = new Discord.MessageActionRow().addComponents(dateTextInput);
          const newModal = new Discord.Modal()

          newModal.setTitle("Inactivity Notice");
          newModal.setCustomId(`inactivitymodal_${guildId}_${memberId}_${robloxId}`);
          newModal.addComponents(dateActionRow, reasonActionRow);

          await Interaction.showModal(newModal);
        } else if (Id.includes('inactivityaction')) {
          const split = Id.split("_");
          const action = split[1];
          const guildId = split[2];
          const inactivityDate = split[3];
          const memberId = split[4];
          const robloxId = Number(split[5]);

          const Embed = Message.embeds[0];
          const inactivityReason = Embed.description.split("Reason: ")[1];
          const formatted = (action == "approve") ? "Approved" : "Denied";
          const userInfo = await Roblox.getPlayerInfo(robloxId);

          // if (String(Member.id) === String(memberId)) {
          //   return await Interaction.reply({
          //     content: `You cannot ${action} your own inactivity notice!`,
          //     ephemeral: true
          //   });
          // };

          if (formatted == "Approved") {
            const document = new inactivityModel({
              discordId: String(memberId),
              robloxId,
              guildId: String(guildId),
              starts: String(Date.now()),
              ends: String(inactivityDate),
              reason: inactivityReason,
            });

            try {
              await document.save();

              const guild = await Client.guilds.fetch(guildId);
              const member = await guild.members.fetch(memberId);
              let descExtension = (action == "approve") ? ` Your inactivity has started, please make sure you're back at the time you specified otherwise staffing will have to take action towards you!` : ``;

              await CreateEmbed(member, `${Settings.Options.embedHeader} |  Inactivity Notice`, `Your inactivity notice has been ${formatted}!${descExtension}`);
            } catch(error) {
              console.error(error);
            };
          };

          const newDescription = Embed.description + `\n\n**${formatted} by** ${Member}`;
          return await Interaction.update({
            embeds: [{
              title: `${Settings.Options.embedHeader} |  Inactivity Notice`,
              color: Message.embeds[0].color,
              description: newDescription,
              timestamp: Date.now()
            }],
            components: []
          });
        } else if (Id.includes('newalliance')) {
          const split = Id.split("_");
          const memberId = split[1];

          const allianceTagTextInput = new Discord.TextInputComponent({
            customId: "allianceURL",
            label: "What's the group's url?",
            minLength: 27,
            maxLength: 100,
            style: "SHORT",
            required: true
          });

          const allianceGroupDescription = new Discord.TextInputComponent({
            customId: "allianceGroupDesc",
            label: "Enter an excerpt of their description:",
            minLength: 10,
            maxLength: 1000,
            style: "PARAGRAPH",
            required: true
          });

          const allianceDiscordInput = new Discord.TextInputComponent({
            customId: "allianceDiscord",
            label: "What's the discord invite of this alliance?",
            minLength: 20,
            maxLength: 40,
            style: "SHORT",
            required: true
          });

          const allianceGuildMemberCountInput = new Discord.TextInputComponent({
            customId: "allianceGuildMemberCount",
            label: "Whats the quantity of users in this discord?",
            minLength: 1,
            maxLength: 7,
            style: "SHORT",
            required: true
          });

          const allianceTagRow = new Discord.MessageActionRow().addComponents(allianceTagTextInput);
          const allianceGroupDescriptionRow = new Discord.MessageActionRow().addComponents(allianceGroupDescription);
          const allianceDiscordRow = new Discord.MessageActionRow().addComponents(allianceDiscordInput);
          const allianceGuildMemberCountRow = new Discord.MessageActionRow().addComponents(allianceGuildMemberCountInput);
          const newModal = new Discord.Modal()

          newModal.setTitle("New Alliance");
          newModal.setCustomId(`newalliancemodal_${memberId}`);
          newModal.addComponents([allianceTagRow, allianceGroupDescriptionRow, allianceDiscordRow, allianceGuildMemberCountRow]);

          await Interaction.showModal(newModal);
        } else if (Id.includes('allianceevent')) {
          const split = Id.split("_");
          const memberId = split[1];

          const allianceDiscordUrl = new Discord.TextInputComponent({
            customId: "allianceDiscord",
            label: "What's the alliance's discord url?",
            minLength: 10,
            maxLength: 100,
            style: "SHORT",
            required: true
          });

          const allianceGroupInput = new Discord.TextInputComponent({
            customId: "allianceGroup",
            label: "What's the alliance's group url?",
            minLength: 27,
            maxLength: 100,
            style: "SHORT",
            required: true
          });

          const allianceEventDescription = new Discord.TextInputComponent({
            customId: "allianceEventDescription",
            label: "Enter a brief description of their event:",
            minLength: 10,
            maxLength: 1000,
            style: "PARAGRAPH",
            required: true
          });

          const allianceEventDescriptionRow = new Discord.MessageActionRow().addComponents(allianceEventDescription);
          const allianceGroupUrlRow = new Discord.MessageActionRow().addComponents(allianceGroupInput);
          const allianceDiscordUrlRow = new Discord.MessageActionRow().addComponents(allianceDiscordUrl);
          const newModal = new Discord.Modal()

          newModal.setTitle("Alliance Event");
          newModal.setCustomId(`allianceeventmodal_${memberId}`);
          newModal.addComponents([allianceEventDescriptionRow, allianceGroupUrlRow, allianceDiscordUrlRow]);

          await Interaction.showModal(newModal);
        } else if (Id.includes('betaunenroll')) {
          const discordId = split[1];

          const betaunenroll = new Discord.TextInputComponent({
            customId: "betaunenroll",
            label: "Are you sure you want to unenroll? (y/n)",
            minLength: 1,
            maxLength: 3,
            style: "SHORT",
            required: true
          });

          const betaunenrollRow = new Discord.MessageActionRow().addComponents(betaunenroll);
          const newModal = new Discord.Modal()

          newModal.setTitle("Update Beta Enrollment");
          newModal.setCustomId(`betaunenrollmodal_${discordId}_${split[2]}`);
          newModal.addComponents([betaunenrollRow]);

          await Interaction.showModal(newModal);
        };
      } else if (Interaction.isModalSubmit()) {
        const Message = Interaction.message;
        const Member = Interaction.member;
        const Id = Interaction.customId;

        if (Id.includes('inactivitymodal')) {
          const split = Id.split("_");
          const guildId = split[1];
          const memberId = split[2];
          const robloxId = split[3];

          const dateInput = Interaction.fields.getTextInputValue('inactivityDate');
          const reason = Interaction.fields.getTextInputValue('inactivityReason');
          const userInformation = await Roblox.getPlayerInfo(Number(robloxId));
          const userRole = await Roblox.getRankNameInGroup(Settings.robloxGroupId, Number(robloxId));

          const date = convertTimeToEST(dateInput.split(" "));
          const nowDate = Moment().tz("America/New_York");

          if (date.TimeEST.get("year") < nowDate.get("year") || (date.TimeEST.get("year") % nowDate.get("year")) > 1) {
            return await Interaction.reply({
              content: `Invalid date format!`,
              ephemeral: true
            });
          };

          if (date.TimeUnix * 1000 < Date.now()) {
            return await Interaction.reply({
              content: `The date you entered is in the past, please try again.`,
              ephemeral: true
            });
          };

          const guild = await Client.guilds.fetch(guildId);
          const channel = await guild.channels.fetch('988905688199729185');
          const member = await guild.members.fetch(memberId);

          await CreateEmbed(channel, 'Inactivity Notice', `An inactivity request requires action.\n\nDiscord: ${member.user.username}#${member.user.discriminator}\nRoblox: [${userInformation.username} (${userRole})](https://roblox.com/users/${robloxId}/profile)\nDate: <t:${date.TimeUnix}>\nReason: ${reason}`, null, null, null, null, null, [{
              Label: "Approve",
              Color: "Success",
              ID: `inactivityaction_approve_${guildId}_${date}_${member.id}_${robloxId}`
            },
            {
              Label: "Deny",
              Color: "Danger",
              ID: `inactivityaction_deny_${guildId}_${date}_${member.id}_${robloxId}`
            }
          ]);

          await Interaction.update({
            embeds: [{
              title: `${Settings.Options.embedHeader} |  Inactivity Notice`,
              color: Message.embeds[0].color,
              description: `We have received your inactivity notice, we will notify you when the HR team changes the status of your form.`,
              timestamp: Date.now()
            }],
            components: []
          });
        } else if (Id.includes('verificationmodal')) {
          const split = Id.split("_");
          const memberId = split[1];
          const guildId = split[2];
          const fields = Interaction.fields.components[0].components;
          const robloxUsername = fields[0].value;

          try {
            const Guild = await Client.guilds.fetch(guildId);
            const Member = await Guild.members.fetch(memberId);
            const robloxId = await Roblox.getIdFromUsername(robloxUsername);
            const robloxUserInfo = await Roblox.getPlayerInfo(robloxId);
            const currentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Files/verificationKeys.json'), 'utf-8'));

            const dataToPush = {
              discordInfo: {
                username: Member.user.username,
                discriminator: Member.user.discriminator,
                id: String(Member.id)
              },
              timeInserted: Date.now(),
              userId: robloxId
            };

            currentData.push(dataToPush);
            fs.writeFileSync(path.join(__dirname, '../../Files/verificationKeys.json'), JSON.stringify(currentData));

            const newButtons = new Discord.MessageActionRow().addComponents([{
              label: "Game Link",
              url: Settings.verificationGameUrl,
              style: 5,
              type: 2
            }]);

            await Interaction.update({
              content: `<@${Member.id}>`,
              components: [newButtons],
              embeds: [{
                title: `${Settings.Options.embedHeader} |  Verification`,
                color: Message.embeds[0].color,
                description: `Hey ${robloxUserInfo.username}! Please join the game below to finish your verification process.`,
                timestamp: Date.now()
              }]
            });
          } catch (error) {
            console.error(error);
            await Interaction.update({
              embeds: [{
                title: `${Settings.Options.embedHeader} |  Verification`,
                color: Message.embeds[0].color,
                description: `An error occurred whilst trying to update our database, please go to a commands channel and type \`${Client.Prefix}verify\`!`,
                timestamp: Date.now()
              }],
              components: []
            });
          }
        } else if (Id.includes('newalliancemodal')) {
          const split = Id.split("_");
          const memberId = split[1];

          if (Member.id != memberId) return;
          const newAllianceURL = Interaction.fields.getTextInputValue('allianceURL');
          const newAllianceDiscord = Interaction.fields.getTextInputValue('allianceDiscord');
          const newAllianceGuildCount = Interaction.fields.getTextInputValue('allianceGuildMemberCount');
          const newAllianceGroupDesc = Interaction.fields.getTextInputValue('allianceGroupDesc');
          const numberRegex = /[0-9]+/g.exec(newAllianceURL);
          const groupId = (numberRegex) ? numberRegex[0] : null;

          try {
            if (!groupId) return await Interaction.update({
              content: "This interaction has stopped due to an invalid group url, please retry by clicking the button again.",
              ephemeral: true
            });

            const channel = await Client.channels.fetch('988905688199729185');
            const allianceGroupInfo = await Roblox.getGroup(groupId);
            const allianceGroupLogo = await Roblox.getLogo(groupId, '420x420', 'png');
            const dominateMe = await getAverageColor(allianceGroupLogo);
            const allianceMemberCount = allianceGroupInfo.memberCount;

            const theirModel = await verifModel.findOne({
              discordId: String(Member.id)
            });
            const theirRank = await Roblox.getRankNameInGroup(Settings.robloxGroupId, Number(theirModel.robloxId));
            const theirUsername = await Roblox.getUsernameFromId(Number(theirModel.robloxId));
            const teamName = await this.#fetchTeamName(Member);
            const roleToNotify = channel.guild.roles.everyone;

            const guildMemberCount = this.#convertNumberToLowerNumber(newAllianceGuildCount);
            const groupMemberCount = this.#convertNumberToLowerNumber(allianceMemberCount);

            const siggy = `\n\n**ROBLOX GROUP**\n> [Link.](${newAllianceURL})\n\n**DISCORD SERVER**\n> [Link.](${newAllianceDiscord})\n\n*Signed,*\n${theirUsername}, ${theirRank}\n**${teamName} Team**`;
            const description = `Greetings, Bean House! On behalf of the Public Relations Affairs, I am thrilled to announce our newest affiliation with **${allianceGroupInfo.name}**! **${allianceGroupInfo.name}** is a **${newAllianceGroupDesc}** with currently **${guildMemberCount}+ DISCORD & ${groupMemberCount}+ ROBLOX** members! We are overjoyed to see the future of this partnership. Provided below will be some crucial public links! We hope that you will be able to support our newest affiliation.${siggy}`;

            await CreateEmbed(channel, `${Settings.Options.embedHeader} |  New Partnership`, description, dominateMe.hex,
              null, null, allianceGroupLogo, null, null, null, {
                content: `${roleToNotify}`,
              });

            return await Interaction.reply({
              content: "Your new alliance announcement has been sent to the discord channel!",
              ephemeral: true
            });
          } catch (error) {
            console.error(error);
            return await Interaction.reply({
              content: "An error occurred whilst trying to send your announcement, please try again later.",
              ephemeral: true
            });
          }
        } else if (Id.includes('allianceeventmodal')) {
          const split = Id.split("_");
          const memberId = split[1];

          if (Member.id != memberId) return;
          const newAllianceEventUrl = Interaction.fields.getTextInputValue('allianceGroup');
          const newAllianceEventDiscord = Interaction.fields.getTextInputValue('allianceDiscord');
          const newAllianceEventDesc = Interaction.fields.getTextInputValue('allianceEventDescription');
          const numberRegex = /[0-9]+/g.exec(newAllianceEventUrl);
          const groupId = (numberRegex) ? numberRegex[0] : null;

          try {
            if (!groupId) return await Interaction.update({
              content: "This interaction has stopped due to an invalid group url, please retry by clicking the button again.",
              ephemeral: true
            });

            const channel = await Client.channels.fetch('988905688199729185');
            const allianceGroupInfo = await Roblox.getGroup(groupId);
            const allianceGroupLogo = await Roblox.getLogo(groupId, '420x420', 'png');
            const dominateMe = await getAverageColor(allianceGroupLogo);

            const theirModel = await verifModel.findOne({
              discordId: String(Member.id)
            });
            const theirRank = await Roblox.getRankNameInGroup(Settings.robloxGroupId, Number(theirModel.robloxId));
            const theirUsername = await Roblox.getUsernameFromId(Number(theirModel.robloxId));
            const teamName = await this.#fetchTeamName(Member);

            const siggy = `\n\n**ROBLOX GROUP**\n> [Link.](${newAllianceEventUrl})\n\n**DISCORD SERVER**\n> [Link.](${newAllianceEventDiscord})\n\n*Signed,*\n${theirUsername}, ${theirRank}\n**${teamName} Team**`
            const description = `Greetings, Bean House! We are ecstatic to announce **${allianceGroupInfo.name}** event. **${newAllianceEventDesc}**. To find more information on the event, do not hesitate to join their communications server to learn more! We hope that you can all attend or participate in **${allianceGroupInfo.name}** spectacular event. Their communications server and ROBLOX group will be linked below for more information!${siggy}`;

            await CreateEmbed(channel, `${Settings.Options.embedHeader} |  Partnership Event`, description, dominateMe.hex,
              null, null, allianceGroupLogo, null, null, null, {
                content: `<@&${Settings.Options.MentionRoles.affiliatePings}>`
              });
            return await Interaction.update({
              content: "Your new alliance event announcement has been sent to the discord channel!",
              ephemeral: true
            });
          } catch (error) {
            console.error(error);
            return await Interaction.update({
              content: "An error occurred whilst trying to send your announcement, please try again later.",
              ephemeral: true
            });
          }
        } else if (Id.includes('betaunenrollmodal')) {
          const split = Id.split("_");
          const result = Interaction.fields.getTextInputValue('betaunenroll');

          if (result.indexOf("y") !== -1) {
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Files/betaTestersNotified.json')));
            console.log(data, Array.isArray(data));

            data.splice(data.indexOf(String(Member.id)), 1);
            fs.writeFileSync(path.join(__dirname, '../../Files/betaTestersNotified.json'), JSON.stringify(data));
            
            Settings.betaTesters.splice(Settings.betaTesters.indexOf(String(Member.id)), 1);
            fs.writeFileSync(path.join(__dirname, '../../../Settings.json'), JSON.stringify(Settings, null, 2));

            const currentEmbed = Interaction.embeds[0];
            currentEmbed.description = "We've removed you from the beta tester's list."

            return await Interaction.reply({
              embed: currentEmbed,
              components: []
            });
          };

          return await Interaction.reply({
            content: "Alright, you have not been removed as of now. or something blah blah",
            ephemeral: true
          });
        };
      } else if (Interaction.isSelectMenu()) {
        const Message = Interaction.message;
        const Member = Interaction.member;
        const Id = Interaction.customId;

        if (Id.includes('help')) {
          const split = Id.split("_");
          const currentTime = split[3];
          const currentInteractionIndex = Number(split[4]);
          const currentMember = split[5];
          const helpCommand = Client.Commands.get('help');
          const newCategory = Interaction.values[0];

          // Make sure the user changing the embed is the original user who executed the command.
          if (Member.id != currentMember) return;
          try {
            // Handle expiration of the interaction.
            if (Date.now() - currentTime > 1_800_000) {
              return await Interaction.update({
                embeds: [{
                  title: `${Settings.Options.embedHeader} |  Help`,
                  color: Message.embeds[0].color,
                  description: `This embed has expired, please go to a commands channel and type \`${Client.Prefix}help\`!`,
                  timestamp: Date.now()
                }],
                components: []
              });
            };

            // Get the category data for the select menu.
            const categories = helpCommand.getCategories(Client);
            let optionData = [];

            // Loop through the categories and add them to the select menu.
            for (let i = 0; i < categories.length; i++) {
              optionData.push({
                Label: categories[i],
                Description: helpCommand.categoryDescriptions[categories[i]],
                Value: categories[i]
              });
            };

            const Guild = Message.guild;
            const actualMember = await Guild.members.fetch(Member.id);

            let userInformation;
            if (await verifModel.exists({ discordId: String(Member.id) })) {
              userInformation = await verifModel.findOne({ discordId: String(Member.id) });
            };
            actualMember.userInformation = userInformation;

            const chosenCategoryCommands = (await helpCommand.getCategoryCommands(Client, actualMember, newCategory));
            const newTime = Date.now();
            const newId = `help_0_${newTime}_${newCategory}_${currentInteractionIndex}_${Member.id}`;
            let buttonData = null;

            if (chosenCategoryCommands.length > 1) {
              buttonData = [{
                Label: "Back",
                Color: "SECONDARY",
                ID: `help_0_back_${newTime}_${newCategory}_${currentInteractionIndex + .005}_${Member.id}`
              },
              {
                Label: "Next",
                Color: "SECONDARY",
                ID: `help_0_next_${newTime}_${newCategory}_${currentInteractionIndex + .01}_${Member.id}`
              }];
            };

            const useForUpdatingInteraction = await CreateEmbed(Message, `${Settings.Options.embedHeader} | Help`, 'These are all of my listed commands, note that `<>` means the parameter is required and `[]` means they\'re optional.',
              null, chosenCategoryCommands[0], `${newCategory} Page 1/${chosenCategoryCommands.length}`, null, null, buttonData, {
                Placeholder: newCategory,
                Options: optionData,
                ID: newId,
                maxValues: 1
              }, {
                dontSend: true
              }
            );

            return await Interaction.update(useForUpdatingInteraction);
          } catch (error) {
            console.error(error);
            await Interaction.update({
              embeds: [{
                title: `${Settings.Options.embedHeader} |  Help`,
                color: Message.embeds[0].color,
                description: `An error occurred whilst processing this action!`,
                timestamp: Date.now()
              }],
              components: []
            });
          };
        } else if (Id.includes('reactionroles')) {
          let errors = [];
          const newMember = await Member.fetch();
          const otherRoles = Interaction.component.options;
          const vals = Interaction.values;
          const rolesToAdd = otherRoles.filter(role => vals.includes(role.value));
          const removed = otherRoles.filter(role => rolesToAdd.filter(role2 => role2.value == role.value).length === 0);
          const removeAllIncluded = rolesToAdd.filter(role => role.value === "removal").length > 0;
          await Interaction.deferReply({ephemeral: true});

          if (!removeAllIncluded) {
            for (const roleInfo of removed) {
              try {
                await newMember.roles.remove(String(roleInfo.value));
              } catch(error) {};
            };
  
            for (const roleInfo of rolesToAdd) {
              try {
                await newMember.roles.add(String(roleInfo.value));
              } catch(error) {
                errors.push(roleInfo.label);
              };
            };
          } else {
            for (const roleInfo of otherRoles) {
              if (roleInfo.value === "removal") continue;
              try {
                await newMember.roles.remove(String(roleInfo.value));
              } catch(error) {};
            };
          };

          if (errors.length > 0) {
            return await Interaction.followUp({ content: `Oops! It appears this server's roles aren't compatible! \`${errors.join(", ")}\``, ephemeral: true });
          };
          
          await Interaction.followUp({ content: "Your roles have been updated.", ephemeral: true });
        } else if (Id.includes('scheduleshifts')) {
          const docs = await verifModel.find({});
          let newDocs = [];

          for (const i in docs) {
            if (Object.keys(docs[i].data).indexOf('Shifts') !== -1) {
              newDocs.push(docs[i]);
            };
          };

          const selectedValue = Interaction.values[0];
          const now = Date.now();

          switch(selectedValue) {
            case 'training': // All future / current training shifts.
              const trainingShifts = newDocs.filter(doc => doc.data.Shifts.filter(shift => shift.Type === 'Training' && (shift.preferredTime * 1000) - now > 0).length > 0);
              const trainingEmbed = Message.embeds[0];

              if (trainingShifts.length === 0) {
                trainingEmbed.description = "There are no upcoming training shifts at the moment.";

                return await Interaction.update({ embeds: [trainingEmbed], components: Message.components });
              };
              break;
            case 'restaurant': // All future / current restaurant shifts.
              const restaurantShifts = newDocs.filter(doc => doc.data.Shifts.filter(shift => shift.Type === 'Restaurant' && (shift.preferredTime * 1000) - now > 0).length > 0);
              const restaurantEmbed = Message.embeds[0];

              if (restaurantShifts.length === 0) {
                restaurantEmbed.description = "There are no upcoming restaurant shifts at the moment.";

                return await Interaction.update({ embeds: [restaurantEmbed], components: Message.components });
              };

              restaurantEmbed.description = "";
              restaurantEmbed.fields = [];
              let bubbleSortRequiredArr = [];

              bubbleSortRequiredArr.sort((a, b) => {
                return a.data.Shifts.preferredTime < b.data.Shifts.preferredTime ? -1 : 1;
              });

              for (const i of bubbleSortRequiredArr) {
                const shift = bubbleSortRequiredArr[i];
                
                personalEmbed.fields.push({
                  name: `${shift.Type} Shift`,
                  value: `<t:${shift.preferredTime}>`,
                  inline: true
                });

                if (shift === 5) break;
              };

              break;
            case 'personal': // All the shifts being hosted personally by that user.
              const personalShifts = newDocs.filter(doc => doc.discordId === Member.id && doc.data.Shifts.filter(shift => (shift.preferredTime * 1000) - now > 0).length > 0);
              const personalEmbed = Message.embeds[0];

              if (personalShifts.length === 0) {
                personalEmbed.description = "You have no upcoming shifts at the moment.";

                return await Interaction.update({ embeds: [personalEmbed], components: Message.components });
              };

              personalEmbed.description = "";
              personalEmbed.fields = [];

              for (const shift of personalShifts[0].data.Shifts) {
                personalEmbed.fields.push({
                  name: `${shift.Type} Shift`,
                  value: `<t:${shift.preferredTime}>`,
                  inline: true
                });

                if (shift === 5) break;
              };

              return await Interaction.update({ embeds: [personalEmbed], components: Message.components });
              break;
            default:
              return await Interaction.reply({ content: "Oops! Unknown page!", ephemeral: true });
              break;
          };
        } else if (Id.includes('weeklyShiftReset')) {
          const split = Id.split("_");
          const currentWeek = split[1];
          const ableToBeSeenFor = split[2];
          const value = Interaction.values[0];
          const convertToUpper = () => {
            return String(value).substring(0, 1).toUpperCase() + String(value).substring(1).toLowerCase()
          };
          
          const indexToUse = (value === "restaurant") ? 0 : 1;
          const docs = await shiftModel.findOne({ startWeek: Number(currentWeek) });
          let description = [];

          if (Moment().tz("America/New_York").unix() === Number(ableToBeSeenFor)) {
            const embed = Message.embeds[0];
            embed.description = "This prompt has expired.";

            return Interaction.update({ embeds: [embed] })
          };

          if (typeof(docs.data) === "object" && Object.keys(docs.data).length > 0) {
            for (const userId of Object.keys(docs.data)) {
              const theirData = docs.data[userId];

              try {
                const groupRole = await Roblox.getRankNameInGroup(Settings.robloxGroupId, Number(userId))
                const user = await Roblox.getPlayerInfo(Number(userId));
                description.push(`${user.username} (${groupRole}) - \`${theirData[indexToUse]}\``);
              } catch(error) {
                throw error;
              };
            };

            let currentEmbed = Message.embeds[0];
            
            if (description.length === 0) {
              currentEmbed.description = `There appears to be no users that have attended any \`${convertToUpper()}\` shifts.`;
            } else {
              currentEmbed.description = `This will show all users that have attended any \`${convertToUpper()}\`:\n\n${description.join("\n")}.`;
            };

            return await Interaction.update({ embeds: [currentEmbed] });
          } else {
            return await Interaction.reply({ content: `Oops! Looks like no one has attended any \`${convertToUpper()}\` shifts this week!`, ephemeral: true });
          }
        };
      } else if (Interaction.isCommand()) {
        if (Settings.slashCommandsEnabled === false) return await Interaction.reply({
          content: "Slash commands are not enabled.",
          ephemeral: true
        });

        const commandName = Interaction.commandName;

        if (
          Settings.Options.lockedForMainServer === true &&
          Interaction.guildId === "741105635155902486" &&
          Interaction.user.id != "352604785364697091"
        ) return Interaction.reply({
          content: "This service is locked for the main server, please contact my owner `Rune#0786` to request access.",
          ephemeral: true
        });

        try {
          let fakeMessage = {};
          const command = Client.Commands.get(commandName);
          const Guild = await Client.guilds.fetch(Interaction.guildId);
          const channel = await Client.channels.fetch(Interaction.channelId);

          if (await verifModel.exists({
              discordId: String(Interaction.user.id)
            })) {
            const model = await verifModel.findOne({
              discordId: String(Interaction.user.id)
            });
            Interaction.userInformation = model;
          } else {
            Interaction.userInformation = null;
          };

          fakeMessage.guild = Guild;
          fakeMessage.channel = channel;
          fakeMessage.content = ``;
          fakeMessage.author = Interaction.user;
          fakeMessage.member = Interaction.member;
          fakeMessage.reply = Interaction.reply;
          fakeMessage.send = Interaction.reply;
          fakeMessage.type = "INTERACTION_HANDLER_COMMAND";

          for (let i = 0; i < Interaction.options.data.length; i++) {
            const interactionOption = Interaction.options.data[i];
            console.log(interactionOption);
            switch (interactionOption.type) {
              case "string":
                fakeMessage.content += `${interactionOption.value} `;
                break;
              case "number":
                fakeMessage.content += `${interactionOption.value} `;
                break;
              case "boolean":
                fakeMessage.content += `${interactionOption.value} `;
                break;
              case "MENTIONABLE":
                fakeMessage.content += `<@${interactionOption.value}> `;
            };
          };

          // await command.run(Client, fakeMessage, fakeMessage.content.split(" "));
          // await Interaction.reply({
          //   content: 'doo doo dooooo! slash commands came after the bot was made... sorry for this...',
          //   ephemeral: true
          // });
        } catch (error) {
          console.error(error);
          await Interaction.reply({
            content: `An error occurred whilst trying to run this command, please try again later.`,
            ephemeral: true
          });
        }
      };
    } catch (err) {
      console.error(err);
      if (Interaction.isRepliable()) {
        return await Interaction.reply({
          content: `I ran into an error whilst processing your request, sorry for any inconvenience.`,
          ephemeral: true
        });
      };

      return await Interaction.followUp({
        content: `I ran into an error whilst processing your request, sorry for any inconvenience.`,
        ephemeral: true
      });
    };
  };
};

module.exports = Event;