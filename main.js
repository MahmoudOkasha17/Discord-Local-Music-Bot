//imports
require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
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
var loop = false;
var pause = false;
var vcCurrent = null;

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
      });
  }
  if (command === 'choose') {
    //console.log(args);
    //text
    if (args.length >= 1 && !Number.isInteger(parseInt(args[0]))) {
      var found = false;
      for (var i = 0; i < playlist.length; i++) {
        if (
          playlist[i]
            .match(/([^\/]*)\/*$/)[1]
            .replace('.mp3', '')
            .toLowerCase()
            .includes(args[0])
        ) {
          currentSong = i;
          found = true;
          break;
        }
      }
      if (found) {
        playSong(vc, message);
        return message.reply('Found');
      } else {
        return message.reply('Not Found');
      }
    }
    //number
    else if (args.length >= 1) {
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
    if (currentSong - 1 < 0) {
      currentSong = playlist.length - 1;
    }
    playSong(vc, message);
  }
  if (command === 'loop') {
    message.member.voice.channel;
  }
  if (command === 'pause') {
    if (vcCurrent) {
      if (pause == false) {
        vcCurrent.pause();
        message.reply('Pausing...');
      } else {
        vcCurrent.resume();
        message.reply('Resuming...');
      }
      pause = !pause;
    } else {
      message.reply('Nothing is Playing.');
    }
  }
  if (command === 'resume') {
    if (vcCurrent) {
      if (pause == false) {
        message.reply('Playback is not paused.');
      } else {
        vcCurrent.resume();
        message.reply('Resuming...');
        pause = !pause;
      }
    } else {
      message.reply('Nothing is Playing.');
    }
  }
  if (command === 'leave') {
    //message.member.voice.channel.leave();
    if (channel != null) {
      channel.leave();
      channel = null;
    }
  }
  if (command === 'queue') {
    //const embed = new MessageEmbed().setTitle('Current Queue');
    var msg = '';
    playlist.forEach((song, index) => {
      // embed.addField(
      //   `${i + 1} - `,
      //   `${playlist[i].match(/([^\/]*)\/*$/)[1].replace('.mp3', '')}.`
      // );
      const format =
        `${index + 1} - ` +
        `${song.match(/([^\/]*)\/*$/)[1].replace('.mp3', '')}. \n`;
      var temp = msg + format;
      if (temp.length >= 1900) {
        console.log(message);
        message.channel.send(msg);
        //message.reply(msg);
        msg = format;
        temp = '';
      } else {
        msg += format;
      }
    });
    message.channel.send(msg);
  }
  if (command === 'meme') {
    getMeme(message);
  }
  if (command === 'shuffle') {
    if (playlist.length > 0) {
      shuffleArray(playlist);
    } else {
      message.reply('Playlist Empty');
    }
  }
});
//functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
async function getMeme(message) {
  fetch('https://meme-api.herokuapp.com/gimme')
    .then((res) => res.json())
    .then(async (json) => {
      let msg = await message.channel.send('Fetching you a meme!');
      const embed = new MessageEmbed()
        .setTitle(json.title)
        .setImage(json.url)
        .setFooter(`Link: ${json.postLink} | Subreddit: ${json.subreddit}`);
      msg.edit(embed);
    });
}
function getFiles(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      //console.log(results);
      results = results.concat(getFiles(file));
      //console.log(results);
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}
function playSong(VoiceConnection, message) {
  currentSong = currentSong % playlist.length;
  message.channel.send(
    `Now Playing ${playlist[currentSong]
      .match(/([^\/]*)\/*$/)[1]
      .replace('.mp3', '')}.`
  );
  vcCurrent = VoiceConnection.play(playlist[currentSong]).on('finish', () => {
    currentSong++;
    if (currentSong < playlist.length || loop) {
      playSong(VoiceConnection, message);
    } else {
      currentSong = 0;
      VoiceConnection.disconnect();
    }
  });
}

client.login(process.env.TOKEN);
