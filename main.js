//imports
require('dotenv').config();
const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
//setup
const client = new Discord.Client();
//variables
const prefix = '-';
var playlist = [];
var currentSong = 0;
var channel = null;
var vc = null;

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
  if (command === 'choose') {
    //console.log(args);
    if (args.length >= 1 && !Number.isInteger(parseInt(args[0]))) {
      return message.reply('Invalid Number.');
    }
    if (args.length >= 1) {
      currentSong = args[0] - 1;
      if (currentSong < 0 || currentSong >= playlist.length) {
        return message.reply('Song doesnt belong to playlist.');
      } else {
        playSong(vc, message);
      }
    }
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
        `${playlist[i].match(/([^\/]*)\/*$/)[1].replace('.mp3', '')}.`
      );
      i++;
    });
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
      .replace('.mp3', '')}.`
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
