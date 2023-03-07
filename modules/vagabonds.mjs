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
    if (number == 0)
        return '';
    else if (number < 0)
        return `-${number}`;
    else
        return `+${number}`;
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