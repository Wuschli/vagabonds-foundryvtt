// Import document classes.
import { VagabondsActor } from "./documents/actor.mjs";
import { VagabondsItem } from "./documents/item.mjs";
// Import sheet classes.
import { VagabondsActorSheet } from "./sheets/actor-sheet.mjs";
import { VagabondsItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { VAGABONDS } from "./helpers/config.mjs";
import { VagabondsDie } from "./helpers/vagabonds-die.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {

    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.vagabonds = {
        VagabondsActor,
        VagabondsItem,
        VagabondsDie
    };

    // Add custom constants for configuration.
    CONFIG.VAGABONDS = VAGABONDS;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    // CONFIG.Combat.initiative = {
    //     formula: "{(@attributes.finesse)d6}cs>=5cs=6",
    //     decimals: 2
    // };

    // Define custom Document classes
    CONFIG.Actor.documentClass = VagabondsActor;
    CONFIG.Item.documentClass = VagabondsItem;

    CONFIG.Dice.terms["v"] = VagabondsDie;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("vagabonds", VagabondsActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("vagabonds", VagabondsItemSheet, { makeDefault: true });

    // Register Babele

    if (typeof Babele !== 'undefined') {
        Babele.get().setSystemTranslationsDir('lang');

    }

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
            outStr += arguments[arg];
        }
    }
    return outStr;
});

Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});

Handlebars.registerHelper('bonus', function (number) {
    if (!number)
        return '';
    else if (number < 0)
        return `-${number}`;
    else
        return `+${number}`;
});

Handlebars.registerHelper('slot', function (slot) {
    return game.i18n.localize(CONFIG.VAGABONDS.containers[slot]) ?? slot
});

Handlebars.registerHelper('repeat', function (n, options) {
    var outStr = '';

    const start = options.hash['start'] ?? 0;

    for (let i = start; i < n; i++) {
        outStr += options.fn(i);
    }
    return outStr;
});

Handlebars.registerHelper('localize', function (key, options) {

    const data = options.hash;

    if (game.i18n.has(key))
        return foundry.utils.isEmpty(data) ? game.i18n.localize(key) : game.i18n.format(key, data);

    const itemNameKey = `VAGABONDS.ItemNames.${key}`;
    if (game.i18n.has(itemNameKey)) {
        // console.log(key, itemNameKey)
        return foundry.utils.isEmpty(data) ? game.i18n.localize(itemNameKey) : game.i18n.format(itemNameKey, data);
    }

    // return game.i18n.localize(key);
    return key;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
});


/* -------------------------------------------- */
/*  Dice So Nice Hook                           */
/* -------------------------------------------- */

Hooks.once("diceSoNiceReady", async (dice3d) => {
    dice3d.addSystem({ id: "vagabonds-in-the-wilds", name: "Vagabonds in the Wilds" }, "preferred");
    dice3d.addDicePreset({
        type: "dv",
        labels: [
            // 'systems/vagabonds-in-the-wilds/assets/dice/skull_dsn.png',
            // 'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
            // 'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
            // 'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
            // 'systems/vagabonds-in-the-wilds/assets/dice/shield_dsn.png',
            // 'systems/vagabonds-in-the-wilds/assets/dice/sword_dsn.png'
            '1',
            '2',
            '3',
            '4',
            '5',
            '6'
        ],
        // bumpMaps: [
        //     'systems/vagabonds-in-the-wilds/assets/dice/skull_dsn.png',
        //     'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
        //     'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
        //     'systems/vagabonds-in-the-wilds/assets/dice/blank_dsn.png',
        //     'systems/vagabonds-in-the-wilds/assets/dice/shield_dsn.png',
        //     'systems/vagabonds-in-the-wilds/assets/dice/sword_dsn.png'
        // ],
        system: "vagabonds-in-the-wilds"
    });
});



/* -------------------------------------------- */
/*  Render Character Sheet Hook                 */
/* -------------------------------------------- */

// Hooks.on("renderVagabondsActorSheet", async (app, html, data) => {
//     if (!data.owner || !data.actor || !game.user.isTrusted)
//         return;

//     let button = $(`<a class="vagabonds-end-session" id="end-session" title="${game.i18n.localize("VAGABONDS.EndSession")}"><i class="fas fa-right-from-bracket"></i>${game.i18n.localize("VAGABONDS.EndSession")}</a>`);
//     // button.click(() => { data.actor.endSession(); });

//     html.closest('.app').find('.vagabonds-end-session').remove();
//     let titleElement = html.closest('.app').find('.window-title');
//     if (!app._minimized) button.insertAfter(titleElement);
// });