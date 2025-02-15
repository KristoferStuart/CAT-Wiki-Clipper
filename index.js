const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.contexts = new Collection();
const contextsPath = path.join(__dirname, "contexts");
const contextFiles = fs
  .readdirSync(contextsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of contextFiles) {
  const filePath = path.join(contextsPath, file);
  const context = require(filePath);

  if ("data" in context && "execute" in context) {
    client.contexts.set(context.data.name, context);
  } else {
    console.log(
      `[WARNING] The context command at ${filePath} is missing a required "data" property.`,
    );
  }
}

client.login(process.env.BOT_TOKEN);
