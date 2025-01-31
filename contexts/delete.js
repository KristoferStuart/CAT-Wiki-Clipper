const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageFlags,
} = require("discord.js");
const path = require("node:path");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName(`${path.basename(__filename, ".js")}`)
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    if (
      interaction.user.id ===
      interaction.targetMessage.interactionMetadata.user.id
    ) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.targetMessage.delete();
      await interaction.deleteReply();
    } else {
      interaction.reply({
        content: `Oops! This command can only delete clips you've posted.`,
      });
    }
    return;
  },
};
