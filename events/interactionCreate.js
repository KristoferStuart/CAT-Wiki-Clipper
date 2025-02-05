const {
  Events,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const puppeteer = require("puppeteer");
const theme = require('../themes.json');


module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    } else if (interaction.isButton()) {
      switch (interaction.customId) {
        case "post-img": {
          let opt = JSON.parse(interaction.message.content);
          switch (interaction.customId) {
            case `width-adjust`: {
              opt.width = parseFloat(interaction.values[0]);
              break;
            }
            case `scale-adjust`: {
              opt.scale = parseFloat(interaction.values[0]);
              break;
            }
          }
          let section = "";
          const article = opt.article;
          const width = opt.width;
          const scale = opt.scale;
          if (opt.section) {
            section = opt.section;
          }
          await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
          await interaction.editReply({
            content: "Posting...",
            files: [],
            components: [],
            flags: MessageFlags.Ephemeral,
          });
          const res = await fetch(
            `https://wiki.rossmanngroup.com/api.php?action=parse&format=json&disableeditsection=1&page=${encodeURIComponent(article)}&prop=text|displaytitle&formatversion=2&redirects=1${section}`,
          );
          const resjson = await res.json();
          let html = resjson.parse.text;
          html = html.replaceAll(
            "/thumb.php",
            "https://wiki.rossmanngroup.com/thumb.php",
          );
          html = html.replaceAll(
            "/images/",
            "https://wiki.rossmanngroup.com/images/",
          );
          const browser2 = await puppeteer.launch({
            args: ['--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-session-crashed-bubble',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--noerrdialogs',
              '--disable-gpu']
          });
          const page = await browser2.newPage();
          await page.setContent(`
            <body class="skin--responsive skin-vector skin-vector-search-vue mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject page-Mission_statement rootpage-Mission_statement skin-vector-2022 action-view uls-dialog-sticky-hide">
            <div class="mw-page-container">
            <div class="mw-page-container-inner">
            <div class="mw-content-container">
            <main id="content" class="mw-body">
            <div id="bodyContent" class="vector-body ve-init-mw-desktopArticleTarget-targetContainer" aria-labelledby="firstHeading" data-mw-ve-target-container>
            <div id="mw-content-text" class="mw-body-content">
            ${(section !== "")? `<h1>${article}</h1>` : ``}
            ${html}
            <div style="display:flex; justify-content: center; color:grey; padding-top:15px; padding-bottom:10px; font-size: 16px">https://wiki.rossmanngroup.com/wiki/${article}</div>
            </div>
            </div>
          </main>
          </div>
          </div>
          </div>
          </body>`
          );
          await page.addStyleTag({ content: `#toc {display:none;}` });
          await page.addStyleTag({
            url: "https://wiki.rossmanngroup.com/load.php?lang=en&modules=ext.visualEditor.desktopArticleTarget.noscript%7Cskins.vector.icons%2Cstyles%7Cskins.vector.search.codex.styles&only=styles&skin=vector-2022",
          });
          await page.addStyleTag({
            url: "https://wiki.rossmanngroup.com/load.php?lang=en&modules=site.styles&only=styles&skin=vector-2022",
          });
          await page.setViewport({
            width: width,
            height: 100,
            deviceScaleFactor: scale,
          });
          const img = await page.screenshot({
            fullPage: true,
            type: "png",
          });
          const imgBuffer = Buffer.from(img);
          const att = new AttachmentBuilder(imgBuffer, {
            name: `${article}.png`,
          });

          await interaction.followUp({
            content: `Clipped by <@${interaction.user.id}>`,
            files: [att],
          });
          await interaction.editReply({ content: "↓↓↓ Image Posted ↓↓↓" });
          await browser2.close();
          break;
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      let opt = JSON.parse(interaction.message.content);
      switch (interaction.customId) {
        case `width-adjust`: {
          opt.width = parseFloat(interaction.values[0]);
          break;
        }
        case `scale-adjust`: {
          opt.scale = parseFloat(interaction.values[0]);
          break;
        }
      }
      let section = "";
      const article = opt.article;
      const width = opt.width;
      const scale = opt.scale;
      if (opt.section) {
        section = opt.section;
      }
      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        content: "Resizing...",
        files: [],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
      const res = await fetch(
        `https://wiki.rossmanngroup.com/api.php?action=parse&format=json&disableeditsection=1&page=${article}&prop=text|displaytitle&formatversion=2&redirects=1${section}`,
      );
      const resjson = await res.json();
      let html = resjson.parse.text;
      html = html.replaceAll(
        "/thumb.php",
        "https://wiki.rossmanngroup.com/thumb.php",
      );
      html = html.replaceAll(
        "/images/",
        "https://wiki.rossmanngroup.com/images/",
      );
      const browser2 = await puppeteer.launch({
        args: ['--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-session-crashed-bubble',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--noerrdialogs',
          '--disable-gpu']
      });
      const page = await browser2.newPage();
      await page.setContent(`
        <body class="skin--responsive skin-vector skin-vector-search-vue mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject page-Mission_statement rootpage-Mission_statement skin-vector-2022 action-view uls-dialog-sticky-hide">
        <div class="mw-page-container">
        <div class="mw-page-container-inner">
        <div class="mw-content-container">
        <main id="content" class="mw-body">
        <div id="bodyContent" class="vector-body ve-init-mw-desktopArticleTarget-targetContainer" aria-labelledby="firstHeading" data-mw-ve-target-container>
        <div id="mw-content-text" class="mw-body-content">
        ${(section !== "")? `<h1>${article}</h1>` : ``}
        ${html}
        <div style="display:flex; justify-content: center; color:grey; padding-top:15px; padding-bottom:10px; font-size: 16px">https://wiki.rossmanngroup.com/wiki/${article}</div>
        </div>
        </div>
      </main>
      </div>
      </div>
      </div>
      </body>`
      );
      await page.addStyleTag({ content: `#toc {display:none;}` });
      await page.addStyleTag({
        url: "https://wiki.rossmanngroup.com/load.php?lang=en&modules=ext.visualEditor.desktopArticleTarget.noscript%7Cskins.vector.icons%2Cstyles%7Cskins.vector.search.codex.styles&only=styles&skin=vector-2022",
      });
      await page.addStyleTag({
        url: "https://wiki.rossmanngroup.com/load.php?lang=en&modules=site.styles&only=styles&skin=vector-2022",
      });
      await page.setViewport({
        width: width,
        height: 100,
        deviceScaleFactor: scale,
      });
      const img = await page.screenshot({
        fullPage: true,
        type: "png",
      });
      const imgBuffer = Buffer.from(img);
      const att = new AttachmentBuilder(imgBuffer, {
        name: `${article}.png`,
      });
      const widthSelect = new StringSelectMenuBuilder()
        .setCustomId("width-adjust")
        .setPlaceholder("Adjust Width");
      for (i = 0, p = 200; i < 14; i++, p += 100) {
        widthSelect.addOptions(
          new StringSelectMenuOptionBuilder().setLabel(`${p}`).setValue(`${p}`),
        );
      }
      const scaleSelect = new StringSelectMenuBuilder()
        .setCustomId("scale-adjust")
        .setPlaceholder("Adjust Scale")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel(`1.0`).setValue(`1.0`),
          new StringSelectMenuOptionBuilder().setLabel(`1.1`).setValue(`1.1`),
          new StringSelectMenuOptionBuilder().setLabel(`1.2`).setValue(`1.2`),
          new StringSelectMenuOptionBuilder().setLabel(`1.3`).setValue(`1.3`),
          new StringSelectMenuOptionBuilder().setLabel(`1.4`).setValue(`1.4`),
          new StringSelectMenuOptionBuilder().setLabel(`1.5`).setValue(`1.5`),
          new StringSelectMenuOptionBuilder().setLabel(`1.6`).setValue(`1.6`),
          new StringSelectMenuOptionBuilder().setLabel(`1.7`).setValue(`1.7`),
          new StringSelectMenuOptionBuilder().setLabel(`1.8`).setValue(`1.8`),
          new StringSelectMenuOptionBuilder().setLabel(`1.9`).setValue(`1.9`),
          new StringSelectMenuOptionBuilder().setLabel(`2.0`).setValue(`2.0`),
        );

      const actionRow1 = new ActionRowBuilder().addComponents([widthSelect]);
      const actionRow2 = new ActionRowBuilder().addComponents([scaleSelect]);
      const postHereButton = new ButtonBuilder()
        .setCustomId("post-img")
        .setLabel("Post")
        .setStyle(ButtonStyle.Secondary);
      const actionRow3 = new ActionRowBuilder().addComponents([postHereButton]);
      await interaction.editReply({
        content: JSON.stringify(opt),
        flags: MessageFlags.Ephemeral,
        files: [att],
        components: [actionRow1, actionRow2, actionRow3],
      });
      await page.close();
    } else if (interaction.isMessageContextMenuCommand()) {
      const context = interaction.client.contexts.get(interaction.commandName);

      if (!context) {
        console.error(
          `No context command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        await context.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this context command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this context command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } else {
      return;
    }
  },
};
