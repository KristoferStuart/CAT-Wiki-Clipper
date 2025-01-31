const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const wait = require("node:timers/promises").setTimeout;

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Deleting all guild commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.DEV_GUILD_ID,
      ),
      { body: [] },
    );
    console.log("Successfully deleted all guild commands.");
  } catch (error) {
    console.error(error);
  }
  return;
})();
