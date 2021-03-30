//imports
require('dotenv').config();
const Discord = require('discord.js');
const WOKCommands = require('wokcommands');
//setup
const client = new Discord.Client();
//variables
//const guildId = '790295430016532550';
const guildIds = ['790295430016532550', '465017050725875713'];
const prefix = '-';

client.on('ready', () => {
  console.log('bot online');
  new WOKCommands(client, {
    commandsDir: 'commands',
    testServers: guildIds,
    showWarns: false,
  }).setDefaultPrefix(prefix);
});

// //get app
// const getApp = (guildId) => {
//   const app = client.api.applications(client.user.id);
//   if (guildId) {
//     app.guilds(guildId);
//   }
//   return app;
// };

// client.on('ready', async () => {
//   console.log('bot online');
//   //list of commands
//   const commands = await getApp(guildId).commands.get();
//   console.log(commands);
//   //adding commands
//     await getApp(guildId).commands.post({
//       data: {
//         name: 'ping',
//         description: 'A simple ping',
//       },
//     });
//   //deleting commands(get id from console)
//   //await getApp(guildId).commands('id').delete();
//   //commands
//   client.ws.on('INTERACTION_CREATE', async (interaction) => {
//     const command = interaction.data.name.toLowerCase();

//     if (command === 'ping') {
//       reply(interaction, 'pong');
//     }
//   });
//   //functions
//   const reply = (interaction, response) => {
//     client.api.interactions(interaction.id, interaction.token).callback.post({
//       data: {
//         type: 4,
//         data: {
//           content: response,
//         },
//       },
//     });
//   };
// });

// client.on('ready', async () => {
//   console.log('bot online');
//   //list of commands
//   const commands = await getApp(guildId).commands.get();
//   console.log(commands);
//   //adding commands
//   await getApp(guildId).commands.post({
//     data: {
//       name: 'ping',
//       description: 'A simple ping',
//     },
//   });
//   //deleting commands(get id from console)
//   await getApp(guildId).commands('id').delete();
//   //commands
//   client.ws.on('INTERACTION_CREATE', async (interaction) => {
//     const command = interaction.data.name.toLowerCase();

//     if (command === 'ping') {
//       reply(interaction, 'pong');
//     }
//   });
//   //functions
//   const reply = (interaction, response) => {
//     client.api.interactions(interaction.id, interaction.token).callback.post({
//       data: {
//         type: 4,
//         data: {
//           content: response,
//         },
//       },
//     });
//   };
// });

// client.on('message', (message) => {
//   if (!message.content.startsWith(prefix) || message.author.bot) return;
//   const args = message.content.slice(prefix.length).split(/ +/);
//   const command = args.shift().toLowerCase();
//   if (command === 'play') {
//     // Checking if the message author is in a voice channel.
//     if (!message.member.voice.channel)
//       return message.reply('You must be in a voice channel.');
//     // Checking if the bot is in a voice channel.
//     if (message.guild.me.voice.channel)
//       return message.reply("I'm already playing.");

//     // Joining the channel and creating a VoiceConnection.
//     message.member.voice.channel
//       .join()
//       .then((VoiceConnection) => {
//         // Playing the music, and, on finish, disconnecting the bot.
//         VoiceConnection.play('./Music/not.mp3').on('finish', () =>
//           VoiceConnection.disconnect()
//         );
//         message.reply('Playing...');
//       })
//       .catch((e) => {
//         console.log(e);
//         VoiceConnection.disconnect();
//       });
//   }
//   if (command === 'leave') {
//     VoiceConnection.disconnect();
//   }
//   if(command ==="volume"){

//   }
// });

client.login(process.env.TOKEN);
