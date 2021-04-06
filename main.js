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
const prefix = '=';
var playlist = [];
var playlists = [];
var playliststitles = [];
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
    if (playlist.length == 0) {
      playlist = getFiles('./Music');
      playlist = playlist.filter((song) => !song.includes('.gitkeep'));
      for (var i = 0; i < playlists.length; i++) {
        playlists[i] = playlists[i].filter(
          (song) => !song.includes('.gitkeep')
        );
      }
    }

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
  if (command === 'playlists') {
    var msg = '';
    playlist = getFiles('./Music');
    playlist = playlist.filter((song) => !song.includes('.gitkeep'));
    for (var i = 0; i < playlists.length; i++) {
      playlists[i] = playlists[i].filter((song) => !song.includes('.gitkeep'));
      msg += `${i + 1} - ${playliststitles[i]} \n`;
    }
    if (playlist.length == 0) {
      return message.reply('Playlist is empty.');
    }
    message.channel.send(msg);
  }
  if (command === 'playlist') {
    //console.log(playlist);
    if (playlist.length == 0) {
      return message.reply('Playlist is empty.');
    }
    if (args.length >= 1 && !Number.isInteger(parseInt(args[0]))) {
      return message.reply('Enter a valid number.');
    }
    if (args[0] != undefined) {
      console.log(args[0]);
      playlist = playlists[(args[0] - 1) % playlists.length];
      currentSong = 0;
      if (vc != null) {
        playSong(vc, message);
      }
    } else {
      return message.reply('Enter a valid number.');
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
    var enouph = false;
    //setting attachments(cant figure out a better way)
    if (metadata.common.picture) {
      fs.writeFileSync('./cover.png', metadata.common.picture[0].data);
      embed.attachFiles(['./cover.png']);
    }
    //title
    if (metadata.common.title) {
      enouph = true;
      embed.setTitle(`Song Title : ${metadata.common.title}`);
    }
    //Auther
    if (metadata.common.artist && metadata.common.picture) {
      enouph = true;
      //console.log(metadata.common.artist.replace(/ *\([^)]*\) */g, ''));
      embed.setAuthor(
        metadata.common.artist,
        'attachment://cover.png',
        `https://en.wikipedia.org/wiki/${metadata.common.artist
          .replace(/ *\([^)]*\) */g, '')
          .replace(' ', '_')}`
      );
    }
    //album
    if (metadata.common.album) {
      enouph = true;
      embed.addField('Album', metadata.common.album, true);
    }
    //albumartist
    if (metadata.common.albumartist) {
      enouph = true;
      embed.addField('Album Artist', metadata.common.albumartist, true);
    }
    //artist
    if (metadata.common.artist && metadata.common.artists.length <= 1) {
      enouph = true;
      embed.addField('Artist', metadata.common.artist);
    }
    if (metadata.common.artists && metadata.common.artists.length > 1) {
      enouph = true;
      var temp = '';
      for (var i = 0; i < metadata.common.artists.length; i++) {
        temp += metadata.common.artists[i] + ' ';
      }
      embed.addField('Artists', temp);
    }
    //genre
    if (metadata.common.genre) {
      enouph = true;
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
      enouph = true;
      //thumbnail
      embed.setThumbnail('attachment://cover.png');
    }
    //composer
    if (metadata.common.composer) {
      enouph = true;
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
      enouph = true;
      embed.setFooter(`Release : ${metadata.common.year}`);
    }
    if (enouph) {
      message.reply(embed);
    } else {
      message.reply('Song has no metadata');
    }
  } catch (error) {
    console.error(error.message);
    message.reply('Song has no metadata');
  }
}
var isArray =
  Array.isArray ||
  function (value) {
    return {}.toString.call(value) !== '[object Array]';
  };
function shuffleTogather() {
  var arrLength = 0;
  var argsLength = arguments.length;
  var rnd, tmp;

  for (var index = 0; index < argsLength; index += 1) {
    if (!isArray(arguments[index])) {
      throw new TypeError('Argument is not an array.');
    }

    if (index === 0) {
      arrLength = arguments[0].length;
    }

    if (arrLength !== arguments[index].length) {
      throw new RangeError('Array lengths do not match.');
    }
  }

  while (arrLength) {
    rnd = Math.floor(Math.random() * arrLength);
    arrLength -= 1;
    for (argsIndex = 0; argsIndex < argsLength; argsIndex += 1) {
      tmp = arguments[argsIndex][arrLength];
      arguments[argsIndex][arrLength] = arguments[argsIndex][rnd];
      arguments[argsIndex][rnd] = tmp;
    }
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
function getFiles(dir, depth = 0, playlistindex = 0) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    var temp = file;
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      //console.log(results);
      if (depth == 0) {
        playliststitles[playlistindex] = temp;
        //console.log(playliststitles[playlistindex]);
        playlists[playlistindex] = getFiles(file, depth + 1, playlistindex + 1);
        playlistindex = playlistindex + 1;
        //console.log(depth);
      }
      results = results.concat(getFiles(file, depth + 1));
      //console.log(results);
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}
function playSong(VoiceConnection, message) {
  //console.log(playlist);
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
