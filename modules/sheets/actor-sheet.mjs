/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class VagabondsActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vagabonds", "sheet", "actor"],
      template: "systems/vagabonds-in-the-wilds/templates/actor/actor-sheet.html",
      width: 640,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "inventory" }]
    });
  }

  /** @override */
  get template() {
    return `systems/vagabonds-in-the-wilds/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    const systemData = context.system;
    // Handle method labels and attribute grouping.
    for (let [k, method] of Object.entries(systemData.methods)) {
      method.label = game.i18n.localize(CONFIG.VAGABONDS.methods[k]) ?? k;

      systemData.attributes[method.attribute].methods[k] = method;
    }

    // Handle attribute labels.
    for (let [k, attribute] of Object.entries(systemData.attributes)) {
      attribute.label = game.i18n.localize(CONFIG.VAGABONDS.attributes[k]) ?? k;
    }

  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = { hands: [], body: [], head: [], pack: [] };
    const talents = [];
    const conditions = [];
    const proficiencies = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item' || i.type === 'condition') {
        gear[i.slot ?? 'pack'].push(i);
      }
      // Append to talents.
      else if (i.type === 'talent') {
        talents.push(i);
      }
      // Append to proficiency.
      else if (i.type === 'proficiency') {
        proficiencies.push(i);
      }
    }

    let usedInventory = 0;

    for (let [n, c] of Object.entries(gear)) {
      for (let i of c) {
        usedInventory += (i.system.size ?? 0);
      }
    }

    // Assign and return
    context.gear = gear;
    context.talents = talents;
    context.conditions = conditions;
    context.proficiencies = proficiencies;
    context.maxInventoryHands = 2;
    context.maxInventoryBody = 3;
    context.maxInventoryHead = 1;
    context.maxInventoryPacked = 6;
    context.maxInventoryTotal = context.maxInventoryHands + context.maxInventoryBody + context.maxInventoryHead + context.maxInventoryPacked;
    context.usedInventory = usedInventory;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle action rolls
    if (dataset.method) {
      let rollData = this.actor.getRollData();
      const diceCount = rollData[dataset.method];
      let formula = `${diceCount}dv`;
      if (diceCount < 1)
        formula = '2dvkl';
      let roll = new Roll(formula);
      await roll.evaluate({ async: true });

      // console.log(roll);
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.method} Action Roll`,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle saving throws
    if (dataset.attribute) {
      let rollData = this.actor.getRollData();
      const diceCount = rollData[dataset.attribute];
      let formula = `${diceCount}dv`;
      if (diceCount < 1)
        formula = '2dvkl';
      let roll = new Roll(formula);
      await roll.evaluate({ async: true });

      // console.log(roll);
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.attribute} Saving Throw`,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }


    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
