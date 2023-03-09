/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([

    // Actor partials.
    "systems/vagabonds-in-the-wilds/templates/actor/parts/actor-inventory.hbs",

    // Dialog partials
    "systems/vagabonds-in-the-wilds/templates/dialog/parts/items.hbs",
    "systems/vagabonds-in-the-wilds/templates/dialog/parts/bonus_push.hbs",
  ]);
};
