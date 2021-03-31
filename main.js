//imports
require('dotenv').config();
const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const WOKCommands = require('wokcommands');
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const fs = require('fs');
//setup
const client = new Discord.Client();
//variables
//const guildId = '790295430016532550';
const guildIds = ['790295430016532550', '465017050725875713'];
const prefix = '-';
var playlist = [];
var currentSong = 0;
var channel = null;
var vc = null;
// client.on('ready', () => {
//   console.log('bot online');
//   new WOKCommands(client, {
//     commandsDir: 'commands',
//     testServers: guildIds,
//     showWarns: false,
//   }).setDefaultPrefix(prefix);
// });

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

client.on('ready', () => {
  console.log('bot online');
});
client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === 'play') {
    // Checking if the message author is in a voice channel.
    if (!message.member.voice.channel)
      return message.reply('You must be in a voice channel.');
    // Checking if the bot is in a voice channel.
    if (message.guild.me.voice.channel)
      return message.reply("I'm already playing.");

    channel = message.member.voice.channel;
    playlist = getFiles('./Music');
    playlist = playlist.filter((song) => !song.includes('.gitkeep'));
    if (playlist.length == 0) {
      return message.reply('Playlist Empty');
    }
    // Joining the channel and creating a VoiceConnection.
    message.member.voice.channel
      .join()
      .then((VoiceConnection) => {
        vc = VoiceConnection;
        // Playing the music, and, on finish, disconnecting the bot.
        playSong(VoiceConnection, message);
      })
      .catch((e) => {
        console.log(e);
        VoiceConnection.disconnect();
      });
  }
  if (command === 'next') {
    currentSong = (currentSong + 1) % playlist.length;
    playSong(vc, message);
    //console.log(playlist);
  }
  if (command === 'prev') {
    if (currentsong - 1 < 0) {
      currentsong = playlist.length - 1;
    }
    playSong(vc, message);
  }
  if (command === 'leave') {
    //message.member.voice.channel.leave();
    if (channel != null) {
      channel.leave();
      channel = null;
    }
  }
  if (command === 'queue') {
    const embed = new MessageEmbed().setTitle('Current Queue');
    var i = 0;
    playlist.forEach((song) => {
      embed.addField(
        `${i + 1} - `,
        `${playlist[i].match(/([^\/]*)\/*$/)[1].replace('.mp3', '')}`
      );
      i++;
    });
    embed.setThumbnail(
      'https://media.discordapp.net/attachments/818535605826748466/818825911516397589/image0-3.gif'
    );
    message.reply(embed);
  }
});
//functions
function getFiles(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}
function playSong(VoiceConnection, message) {
  message.reply(
    `Playing ${playlist[currentSong]
      .match(/([^\/]*)\/*$/)[1]
      .replace('.mp3', '')}`
  );
  VoiceConnection.play(playlist[currentSong]).on('finish', () => {
    currentSong++;
    if (currentSong < playlist.length) {
      playSong(VoiceConnection, message);
    } else {
      currentSong = 0;
      VoiceConnection.disconnect();
    }
  });
}

client.login(process.env.TOKEN);
