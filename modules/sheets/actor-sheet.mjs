/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class VagabondsActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vagabonds", "sheet", "actor"],
      template: "systems/vagabonds-in-the-wilds/templates/actor/actor-sheet.hbs",
      width: 640,
      height: 820,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "inventory" }],
      // dragDrop: [{
      //   dragSelector: ".item-list .item",
      //   dropSelector: ".inventory-container"
      // }]
    });
  }

  /** @override */
  get template() {
    return `systems/vagabonds-in-the-wilds/templates/actor/actor-${this.actor.type}-sheet.hbs`;
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
    // Handle inventory container labels
    for (let [k, container] of Object.entries(context.system.inventory)) {
      container.label = game.i18n.localize(CONFIG.VAGABONDS.containers[k]) ?? k;
    }

    const talents = [];
    const conditions = [];
    const proficiencies = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
    }

    let usedInventory = 0;
    let maxInventoryTotal = 0;

    for (let [n, c] of Object.entries(context.system.inventory)) {
      maxInventoryTotal += c.size;
      for (let i of c.items) {
        usedInventory += (i.system.size ?? 0);
      }
    }

    // Assign and return
    context.inventory = context.system.inventory;
    context.talents = context.system.talents;
    context.conditions = conditions;
    context.proficiencies = context.system.proficiencies;
    context.maxInventoryTotal = maxInventoryTotal;
    context.usedInventory = usedInventory;

    // console.log(context);
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

    const dragDrop = new DragDrop({
      dragSelector: ".item",
      dropSelector: ".inventory-container",
      // permissions: {
      //   dragstart: this.canDragStart.bind(this),
      //   drop: this.canDragDrop.bind(this)
      // },
      callbacks: {
        dragstart: this.onDragStart.bind(this),
        drop: this.onDragDrop.bind(this)
      }
    })
    dragDrop.bind(html.find('.inventory')[0]);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    // console.log(this);
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;

    if (type != 'proficiency' && type != 'talent') {
      const slot = header.dataset.slot;

      const container = this.actor.system.inventory[slot];
      let usedSpace = 0;
      container.items.forEach(i => usedSpace += i.system.size);
      // console.log(usedSpace + '/' + container.size);
      if (usedSpace >= container.size)
        return;
    }

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
      this.actor.rollMethod(dataset.method);
      return;
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

  // canDragStart(selector) {
  //   return this.isEditable && selector == '.item';
  // }

  // canDragDrop(selector) {
  //   return this.isEditable && selector == '.inventory-container';
  // }

  onDragStart(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.getEmbeddedDocument("Item", itemId, true);
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Item",
      sheetTab: this.actor.flags["_sheetTab"],
      actorId: this.actor.id,
      itemId: itemId,
      fromToken: this.actor.isToken,
      data: item
    }));
  }

  async onDragDrop(event) {
    // console.log(event);
  }

  /** @override */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    if (data.documentName !== "Item") return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (!folder) return [];
    return this._onDropItemCreate(folder.contents.map(item => {
      return game.items.fromCompendium(item);
    }), event.target.dataset.slot);
  }

  /** @override */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    const actor = this.actor;
    let sameActor = (data.actorId === actor.id) || (actor.isToken && (data.tokenId === actor.token.id));

    // TODO check if target slot has enough space

    if (sameActor) {
      // console.log(event, itemData);
      // return this._onSortItem(event, itemData);
      return this.moveItemsToSlot([itemData._id], event.target.dataset.slot);
      // TODO Add item sorting
    }

    return this._onDropItemCreate(itemData, event.target.dataset.slot);
    // TODO Remove item from previous Actor
  }

  /** @override */
  async _onDropItemCreate(itemData, slot) {
    slot = slot || 'pack';
    itemData = itemData instanceof Array ? itemData : [itemData];
    const result = await this.actor.createEmbeddedDocuments("Item", itemData);
    await this.moveItemsToSlot(result.map(i => i._id), slot);
    return result;
  }

  async moveItemsToSlot(itemIds, slot) {
    const updates = itemIds.map(id => { return { _id: id, system: { slot: slot } } });
    return this.actor.updateEmbeddedDocuments("Item", updates);
  }
}
