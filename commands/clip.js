const {
  SlashCommandBuilder,
  MessageFlags,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const path = require("node:path");
const puppeteer = require("puppeteer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`${path.basename(__filename, ".js")}`)
    .setDescription("Post a an article")
    .addStringOption((option) =>
      option
        .setName("article")
        .setDescription("Name of the article")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("section")
        .setDescription("section of the article")
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("width")
        .setDescription("Set a custom width (Default: 800)"),
    ),
  async autocomplete(interaction) {
    const option = interaction.options.getFocused(true) || "";
    switch (option.name) {
      case "article": {
        let res, list;
        if (!option.value) {
          res = await fetch(
            "https://wiki.rossmanngroup.com/api.php?action=query&format=json&list=random&formatversion=2&rnnamespace=0&rnfilterredir=all&rnlimit=25",
          );
          const resjson = await res.json();
          list = resjson.query.random.map((item) => item.title);
        } else {
          res = await fetch(
            `https://wiki.rossmanngroup.com/api.php?action=opensearch&format=json&search=${option.value}&formatversion=2&redirects=resolve`,
          );
          const resjson = await res.json();
          list = resjson[1];
        }
        if (!list) {
          await interaction.respond([]);
          break;
        }
        await interaction.respond(
          list.map((item) => ({
            name: item.replaceAll("_", " "),
            value: item.replaceAll(" ", "_"),
          })),
        );
        break;
      }
      case "section": {
        const page = interaction.options.getString("article");
        const res = await fetch(
          `https://wiki.rossmanngroup.com/api.php?action=parse&format=json&page=${encodeURIComponent(page)}&prop=sections&formatversion=2`,
        );
        const resjson = await res.json();
        const list = resjson.parse.sections;
        if (list.error) {
          await interaction.respond([]);
          break;
        }
        await interaction.respond(
          list.map((item) => ({ name: item.line || `n/a`, value: item.index })),
        );
        break;
      }
    }
  },
  async execute(interaction) {
    let section = "";
    let article = interaction.options.getString("article");
    const width = interaction.options.getInteger("width") || 800;
    const scale = interaction.options.getInteger("scale") || 1.5;
    if (interaction.options.getString("section")) {
      section = `&section=${interaction.options.getString("section")}`;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const res = await fetch(
      `https://wiki.rossmanngroup.com/api.php?action=parse&format=json&disableeditsection=1&page=${encodeURIComponent(article)}&prop=text|displaytitle&formatversion=2&redirects=1${section}`,
    );
    const resjson = await res.json();
    if (!resjson.parse) {
      await interaction.editReply({
        content: `Error fetching article text.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    let html = resjson.parse.text;
    html = html.replaceAll(
      "/thumb.php",
      "https://wiki.rossmanngroup.com/thumb.php",
    );
    html = html.replaceAll(
      "/images/",
      "https://wiki.rossmanngroup.com/images/",
    );
    //const startTitleRemove = html.indexOf('<div class=\"infobox-title\">');
    //const endTitleRemove = html.indexOf("</div>", startTitleRemove) + 7;
    //const fullElement = html.slice(startTitleRemove, endTitleRemove);
    //html = await html.replace(fullElement, "");
    const browser = await puppeteer.launch({
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
    const page = await browser.newPage();
    //old
    //await page.setContent(
    //  `<div style="margin:10px"><span style="font-size:36px">${resjson.parse.displaytitle}</span>${html}<div style="display:flex; justify-content: center; color:grey; padding-top:15px; padding-bottom:10px; font-size: 12px">https://wiki.rossmanngroup.com/wiki/${article}</div></div>`,
    //);
    //test
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
      content: JSON.stringify({
        article: article,
        section: section,
        width: width,
        scale: scale,
      }),
      flags: MessageFlags.Ephemeral,
      files: [att],
      components: [actionRow1, actionRow2, actionRow3],
    });
    await browser.close();
  },
};
