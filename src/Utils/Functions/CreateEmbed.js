const Client = require('../../Discord/index');
const { Message, MessageEmbed, MessageSelectMenu,  } = require('discord.js');

/**
 * Creates an embed with the options provided and returns it.
 * @param  {class<Message>} Message
 * @param  {string} Title
 * @param  {string} Description
 * @param  {number} Color
 * @param  {Array} Fields
 * @param  {Object<{text: string, thumbnail: string}>} Footer
 * @param  {string} Thumbnail
 * @param  {Object<{name: string, iconURL: string}>} Author
 * @param  {Array<ButtonData>} ButtonData
 * @param  {Object<MenuData>} MenuData
 * @param  {Object<{*}>} Extra
 * @returns class<Message>
 */
async function CreateEmbed(MSG, Title, Description, Color, Fields, Footer, Thumbnail, Author, ButtonData, MenuData, Extra={}) {  
  let channel = null;
  let wasMessage = false;
  let author = {
    name: (Author != undefined && Object.keys(Author).filter(k => k === 'Name') != undefined) ? Author.Name : null,
    iconURL: (Author != undefined && Object.keys(Author).filter(k => k === 'Icon') != undefined) ? Author.Icon : null
  };

  if (!(MSG instanceof Message)) {
    channel = MSG;
  } else {
    wasMessage = true;
    channel = MSG.channel;
  };
  
  const Options = {
    title: (Title != undefined) ? Title : "Bean House Assistant",
    description: (Description != undefined) ? Description : "",
    color: (Color != undefined) ? Color : 0x2f3136,
    fields: (Fields != undefined) ? Fields : [],
    thumbnail: (Thumbnail != undefined) ? {url: Thumbnail} : null,
    footer: {
      text: (Footer != undefined) ? Footer : ""
    }
  }
  
  if (author.name != undefined && author.iconURL != undefined) {
    Options["author"] = {
      name: author.name,
      icon: author.iconURL
    }
  }

  const thisEmbed = new MessageEmbed(Options);
  try {
    let sendingFunction = channel.send;
    let shouldntSend = false;
    let menuFunction = getMenuData;
    let buttonFunction = getButtonData;
    const extraKeys = Object.keys(Extra);

    if (extraKeys.includes('reply') && Extra["reply"] === true && wasMessage === true) {
      delete Extra["reply"];
      sendingFunction = MSG.reply;
    } else if (Object.keys(channel).indexOf('content') != -1) {
      // Slash Command
      sendingFunction = MSG.reply;
    };

    if (extraKeys.includes('image')) {
      const imageKeys = Object.keys(Extra["image"]);
      Options.image = {
        url: (imageKeys.indexOf('url') != -1) ? Extra.image.url : null,
        width: (imageKeys.indexOf('width') != -1) ? Extra.image.width : null,
        height: (imageKeys.indexOf('height') != -1) ? Extra.image.height : null
      };

      delete Extra["image"];
    };
    
    if (extraKeys.includes('dontSend') && Extra["dontSend"] === true) {
      delete Extra["dontSend"];
      shouldntSend = true;
    };

    if (extraKeys.includes('useMenuV2') && Extra["useMenuV2"] === true) {
      delete Extra["useMenuV2"];
      menuFunction = getMenuDataWithBuilder;
    };

    if (extraKeys.includes('useTimestamp') && Extra["useTimestamp"] === true) {
      delete Extra["useTimestamp"];
      Options.timestamp = new Date();
    };

    ButtonsInformation = await buttonFunction(ButtonData);
    MenuInformation = await menuFunction(MenuData);

    const components = [];

    if (ButtonsInformation) {
      if (Array.isArray(ButtonsInformation)) {
        let newActionRow = {
          type: 1,
          components: []
        }
        
        for (let i = 0; i < ButtonsInformation.length; i++) {
          newActionRow.components.push(ButtonsInformation[i]);
        }

        components.push(newActionRow);
      } else {
        let newActionRow = {
          type: 1,
          components: []
        }
        newActionRow.components.push(ButtonsInformation);
        components.push(newActionRow);
      }
    }

    if (MenuInformation) {
      let newActionRow = {
        type: 1,
        components: []
      }
      newActionRow.components.push(MenuInformation);
      components.push(newActionRow);
    }

    let target = (sendingFunction && sendingFunction.name === "reply") ? MSG : channel;

    if (MSG.type === "INTERACTION_HANDLER_COMMAND") {
      sendingFunction = MSG.reply;
      target = channel;
    };
    
    if (shouldntSend === false) {
      if (components.length > 0 && components[0].components.length > 0) {
        return await sendingFunction.call(target, {embeds: [thisEmbed], components, ...Extra});
      } else {
        return await sendingFunction.call(target, {embeds: [thisEmbed], ...Extra});
      }
    } else {
      return {embeds: [thisEmbed], components, ...Extra};
    }
  } catch(err) {
    console.error(err);
  }
};

/**
 * Generates the data required to create a button with your parameters.
 * @param {Label<String>, Color<string>, ID<string>, Url<string>} ButtonData 
 * @returns Array<ButtonData>
 */
async function getButtonData(ButtonData) {
  return new Promise(async (resolve) => {
    if (Array.isArray(ButtonData) && ButtonData.length > 0) {
      let buttons = [];
      for (let i = 0; i < ButtonData.length; i++) {
        const button = {};
        const { Label, Color, ID } = ButtonData[i];
        
        if (!Label) continue;
        const colorType = getTypeFromColorName((Color) ? String(Color).toUpperCase() : "SECONDARY");
        button.type = 2;
        button.label = Label;
        button.style = colorType
        button.custom_id = (ID) ? ID : String(i);

        if (colorType == 5) {
          button.url = ButtonData[i].Url || "https://roblox.com/groups/1/"
          button.custom_id = null;
        }

        buttons.push(button);
      }
      
      resolve(buttons);
    } else {
      resolve(undefined);
    }
  })
};

/**
 * Generates the data required to create a menu with your parameters.
 * @param {Label<string>, Options<Array>, Placeholder<string>, maxValues<number>, ID<string>} MenuData 
 * @returns Object<MenuData>
 */
async function getMenuData(MenuData) {
  if (MenuData == undefined || !MenuData || typeof(MenuData) != "object") return undefined;
  return new Promise(async (resolve) => {
    const keys = Object.keys(MenuData);
    let maxValues = (MenuData.Options.length > 0) ? MenuData.Options.length : 1;
    let minValues = (Object.keys(MenuData).indexOf('minValues') != -1) ? MenuData.minValues : 1;
    
    if (keys.indexOf('maxValues') != -1) {
      maxValues = MenuData.maxValues;
    };
    
    let Menu = {
      type: 3,
      custom_id: MenuData.ID,
      options: [],
      placeholder: MenuData.Placeholder,
      min_values: minValues,
      max_values: maxValues
    };
    
    let options = [];
    for (let i = 0; i < MenuData.Options.length; i++) {
      const optionData = MenuData.Options[i];
      const Option = {
        label: optionData.Label,
        value: optionData.Value,
        description: optionData.Description
      };

      if (Object.keys(optionData).indexOf("Emoji") != -1) {
        Option.emoji = optionData.Emoji;
      };

      options.push(Option);
    };

    Menu.options.push(...options);
    resolve(Menu);
  })
};

/**
 * Generates the data required to create a menu with your parameters.
 * @param {Label<string>, Options<Array>, Placeholder<string>, maxValues<number>, ID<string>} MenuData 
 * @returns Object<MenuData>
 */
 async function getMenuDataWithBuilder(MenuData) {
  if (MenuData == undefined || !MenuData || typeof(MenuData) != "object") return undefined;
  return new Promise(async (resolve) => {
    const keys = Object.keys(MenuData);
    let maxValues = (MenuData.Options.length > 0) ? MenuData.Options.length : 1;
    
    if (keys.indexOf('maxValues') != -1) {
      maxValues = MenuData.maxValues;
    };

    const Menu = new MessageSelectMenu();
    Menu.setPlaceholder(MenuData.Placeholder);
    Menu.setMaxValues(maxValues);
    Menu.setCustomId(MenuData.ID);
    
    let options = [];
    for (let i = 0; i < MenuData.Options.length; i++) {
      const optionData = MenuData.Options[i];
      const Option = {
        label: optionData.Label,
        value: optionData.Value,
        description: optionData.Description
      };

      if (Object.keys(optionData).indexOf("Emoji") != -1) {
        Option.emoji = optionData.Emoji;
      };

      options.push(Option);
    };

    Menu.setOptions(options);
    resolve(Menu);
  })
};

function getTypeFromColorName(Name) {
  switch(Name) {
    case "PRIMARY":
      return 1;
    break;
    case "SECONDARY":
      return 2;
    break;
    case "SUCCESS":
      return 3;
    break;
    case "DANGER":
      return 4;
    break;
    case "LINK":
      return 5;
    break;
    default:
      return 1;
    break;
  }
}

module.exports = CreateEmbed;