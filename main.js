//imports
require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const mm = require('music-metadata');
const util = require('util');
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
  if (command === 'meta') {
    if (vcCurrent) {
      getMetaData(playlist[currentSong], message);
    } else {
      message.reply('Nothing is Playing.');
    }
  }
});
//functions
async function getMetaData(dir, message) {
  try {
    const metadata = await mm.parseFile(dir);
    //console.log(util.inspect(metadata, { showHidden: false, depth: null }));

    const embed = new MessageEmbed().setColor('#0099ff');
    //console.log(metadata.common);
    //setting attachments(cant figure out a better way)
    fs.writeFileSync('./cover.png', metadata.common.picture[0].data);
    embed.attachFiles(['./cover.png']);
    //title
    if (metadata.common.title) {
      embed.setTitle(`Song Title : ${metadata.common.title}`);
    }
    //Auther
    if (metadata.common.artist && metadata.common.picture)
      embed.setAuthor(
        metadata.common.artist,
        'attachment://cover.png',
        `https://en.wikipedia.org/wiki/${metadata.common.artist}`
      );
    //album
    if (metadata.common.album) {
      embed.addField('Album', metadata.common.album, true);
    }
    //albumartist
    if (metadata.common.albumartist) {
      embed.addField('Album Artist', metadata.common.albumartist, true);
    }
    //artist
    if (metadata.common.artist && metadata.common.artists.length <= 1) {
      embed.addField('Artist', metadata.common.artist);
    }
    if (metadata.common.artists && metadata.common.artists.length > 1) {
      var temp = '';
      for (var i = 0; i < metadata.common.artists.length; i++) {
        temp += metadata.common.artists[i] + ' ';
      }
      embed.addField('Artists', temp);
    }
    //genre
    if (metadata.common.genre) {
      var temp = '';
      for (var i = 0; i < metadata.common.genre.length; i++) {
        temp += metadata.common.genre[i] + ' ';
      }
      if (metadata.common.genre.length > 1) {
        embed.addField('Genres', temp);
      } else {
        embed.addField('Genre', temp);
      }
    }
    //picture
    if (metadata.common.picture) {
      //thumbnail
      embed.setThumbnail('attachment://cover.png');
    }
    //composer
    if (metadata.common.composer) {
      var temp = '';
      for (var i = 0; i < metadata.common.composer.length; i++) {
        temp += metadata.common.composer[i] + ' ';
      }
      if (metadata.common.composer.length > 1) {
        embed.addField('Composers', temp);
      } else {
        embed.addField('Composer', temp);
      }
    }
    //footer (releasedate)
    if (metadata.common.year) {
      embed.setFooter(metadata.common.year);
    }
    message.reply(embed);
  } catch (error) {
    console.error(error.message);
    message.reply('Song has no metadata');
  }
}
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
