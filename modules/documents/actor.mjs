import { rolls } from "../helpers/rolls.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class VagabondsActor extends Actor {

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
    }

    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
        const actorData = this;
        const systemData = actorData.system;
        const flags = actorData.flags.boilerplate || {};

        // Make separate attributes for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData);
        this._prepareNpcData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        if (actorData.type !== 'character') return;

        // Make modifications to data here. For example:
        const systemData = actorData.system;

        const attributes = systemData.attributes;
        systemData.fatigue.max = (attributes.might.value + attributes.finesse.value + attributes.wits.value + attributes.heart.value + attributes.shadow.value) / 2;
        systemData.incapacitated = systemData.fatigue.value >= systemData.fatigue.max;
        // console.log("incapacitated", systemData.incapacitated, actorData.name);

        const inventory = {
            hands: {
                size: 2,
                used: 0,
                items: [],
            },
            head: {
                size: 1,
                used: 0,
                items: [],
            },
            body: {
                size: 3,
                used: 0,
                items: [],
            },
            pack: {
                size: 6,
                used: 0,
                items: [],
            },
            extra: {
                size: 0,
                used: 0,
                items: []
            }
        };

        systemData.wounds = 0;

        for (let i of actorData.items) {
            // Append to inventory.
            if (i.type === 'item' || i.type === 'condition' || i.type === 'wound') {
                const slot = i.system.slot || 'extra';
                inventory[slot].items.push(i);
                inventory[slot].used += i.system.size;
            }
            if (i.type === 'proficiency')
                systemData.proficiencies.push(i);
            if (i.type === 'talent')
                systemData.talents.push(i);
            if (i.type === 'wound')
                systemData.wounds += 1;
        }
        systemData.inventory = inventory;
    }

    /**
     * Prepare NPC type specific data.
     */
    _prepareNpcData(actorData) {
        if (actorData.type !== 'npc') return;

        // Make modifications to data here. For example:
        // const systemData = actorData.system;
        // systemData.xp = (systemData.cr * systemData.cr) * 100;
    }

    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();

        // Prepare character roll data.
        this._getCharacterRollData(data);
        this._getNpcRollData(data);

        return data;
    }

    /**
     * Prepare character roll data.
     */
    _getCharacterRollData(data) {
        if (this.type !== 'character') return;

        // Copy the scores to the top level, so that rolls can use
        // formulas like `@str.mod + 4`.
        if (data.attributes) {
            for (let [k, v] of Object.entries(data.attributes)) {
                data[k] = v.value;
            }
        }
    }

    /**
     * Prepare NPC roll data.
     */
    _getNpcRollData(data) {
        if (this.type !== 'npc') return;

        // Process additional NPC data here.
    }

    async rollAction(attribute, onDone = null) {

        // console.log(data);

        let d = await rolls.showActionRollDialog(this, attribute, onDone);
    }

    async rollSave(attribute, onDone = null) {

        // console.log(data);

        let d = await rolls.showSavingThrowDialog(this, attribute, onDone);
    }

    async gainFatigue(amount) {
        return this.setFatigue(this.system.fatigue.value + amount);
    }

    async reduceFatigue(amount) {
        return this.setFatigue(this.system.fatigue.value - amount);
    }

    async setFatigue(value) {

        if (value < 0)
            value = 0;

        /** Incapacitated */
        if (value >= this.system.fatigue.max)
            value = this.system.fatigue.max;
        await this.update({ system: { fatigue: { value: value } } });
    }

    async takeDamage(amount) {
        await this.gainFatigue(amount);
        if (this.system.fatigue.value < this.system.fatigue.max)
            return;

        return this.rollSave('might', (roll) => {
            if (roll.total >= 1)
                return;
            this.rollGainWound();
        });
    }

    async rollGainWound() {
        const tables = game.packs.get('vagabonds-in-the-wilds.tables');
        const woundTable = await tables.getDocument("hUnpjrpOydidZ9yU");
        const roll = new Roll(`${this.system.wounds + 1}d6`);
        const woundResult = await woundTable.draw({ roll });
        // console.log(woundResult);
        for (const r of woundResult.results) {

            let collection = null;
            if (r.documentCollection === "Item")
                collection = game.items;
            else if (r.documentCollection === 'vagabonds-in-the-wilds.items')
                collection = game.packs.get(r.documentCollection);

            if (collection) {
                const item = await collection.getDocument(r.documentId);
                // console.log(item);
                await this.createEmbeddedDocuments('Item', [item]);
            }
        }
        return woundResult;
    }
}