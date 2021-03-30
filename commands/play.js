const { MessageEmbed } = require('discord.js');
module.exports = {
  name: 'play',
  slash: true,
  testOnly: true,
  description: 'plays local music',

  callback: ({ message }) => {
    //console.log(message);
    //message.reply('pong');
    if (message) {
      if (!message.member.voice.channel)
        return message.reply('You must be in a voice channel.');
      // Checking if the bot is in a voice channel.
      if (message.guild.me.voice.channel)
        return message.reply("I'm already playing.");

      // Joining the channel and creating a VoiceConnection.
      message.member.voice.channel
        .join()
        .then((VoiceConnection) => {
          // Playing the music, and, on finish, disconnecting the bot.
          VoiceConnection.play('../Music/not.mp3').on('finish', () =>
            VoiceConnection.disconnect()
          );
          message.reply('Playing...');
        })
        .catch((e) => {
          //console.log(e);
          VoiceConnection.disconnect();
        });
    }
    const embed = new MessageEmbed()
      .setTitle('A333333')
      .addField('content', 'some more a3333')
      .addField('za endo', '(╯°□°）╯︵ ┻━┻');
    return embed;
  },
};
