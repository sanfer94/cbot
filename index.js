require('dotenv').config();
const Discord = require('discord.js');
const uuid = require('uuid')
//const Keyv = require('keyv');
//const keyv = new Keyv('sqlite://F:/sqlite/hgdatabase.db');
const Sequelize = require('sequelize');
//const characters = new Keyv('sqlite://F:/sqlite/hgdatabase.db', {namespace: 'Characters'})
const globalPrefix = '?';
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
  storage: 'F:/sqlite/hgdatabase/HungerGamesDatabase.db',
});

const Character = sequelize.define('character', {
  name: {
    type: Sequelize.STRING,
    singular: 'character',
    plural: 'characters',
    primaryKey: true
  },
  character_id: {
    type: Sequelize.UUID,
  }
});

Character.beforeCreate(character => character.character_id = uuid.v4())

const Game = sequelize.define('game', {
  edition: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    singular: 'edition',
    plural: 'editions',
  },
  edition_id: {
    type: Sequelize.UUID,
  }
});

Game.beforeCreate(game => game.edition_id = uuid.v4())

const CharGame = sequelize.define('char_game', {
  edition: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  name: {
    type:Sequelize.TEXT,
    primaryKey: true,
  }
})

bot.login(TOKEN);

bot.once('ready', () => {
  Game.sync()
  Character.sync()
  CharGame.sync()
});

bot.on('message', async msg => {
  if (msg.content.startsWith(globalPrefix)) {
    const input = msg.content.slice(globalPrefix.length).trim().split(' ');
    const command = input.shift().toLowerCase();
    console.info(command)
    const commandArgs = input.join(' ');
    
    /*if(command === 'addCharacter') {
      const characterName = commandArgs
  
      try {
        const character = await Character.create({
          name: characterName.toLowerCase(),
        })
        return msg.reply(`Se creo a ${characterName}`)
      } catch (e) {
        return msg.reply('Algo salió mal agregando el personaje.')
      }
    } else */
    if (command === 'allowed') {
      const characterName = commandArgs.toLowerCase()

      const character = await CharGame.findAll({ where: { name: characterName}});
      if(character){
        const answerToString = character.map(t => t.edition).join(', ')
        return msg.channel.send(`${characterName} participó en los Hunger Games edición: ${answerToString}`)
      }
      return msg.reply(`${characterName} no participó en ningun Hunger Game.`)
    } else if (command === 'addgame') {
      if(msg.member.roles.some(role => role.name === 'Mods')){
      const gameEdition = commandArgs
  
      try {
        const game = await Game.create({
          edition: gameEdition,
        });
        return msg.reply(`Se crearon los HG edición ${game.edition}.`);

      } catch (e) {
        if(e.name === 'SequelizeUniqueConstraintError') {
          return msg.reply('Esa edición ya existe.')
        }
        return msg.reply('Algo salió mal al crear el juego.')
      }
    }
    } else if (command === 'charsfromgame') {
      const gameEdition = commandArgs
      const charList = await CharGame.findAll({where: { edition: gameEdition}})
      const charListToString = charList.map(t => t.name).join(', ') || 'No hay personajes'
      return msg.channel.send(charListToString)
    } else if (command === 'addchartogame') {
      if(msg.member.roles.some(role => role.name === 'Mods')){
      const splitArgs = commandArgs.split('-');
      const characterName = splitArgs.shift().trim().toLowerCase();
      const gameEdition = splitArgs.join(' ').trim();
      const characterExists = await Character.findOne({where: {name: characterName}})
      if(characterExists === undefined){
        try {
          const character = await Character.create({
            name: characterName,
          })
        } catch (e) {
          if(e.name === 'SequelizeUniqueConstraintError') {
            msg.reply('Ya existe ese personaje')
          }
        }
      }
        try {
          const game = await Game.findOne({where: {edition: gameEdition}})
          if (game) {
            try{
              CharGame.create({
                name: characterName, 
                edition: game.edition
              })
            } catch (e) {
              msg.channel.send(e.name)
            }

          } else {
            msg.reply(`La edición ${gameEdition} todavía no fue registrada.`)
          }
        } catch (e) {
          if(e.name === 'SequelizeUniqueConstraintError') {
            msg.reply('existe')
          }
        }
      }
      }
  }
})
