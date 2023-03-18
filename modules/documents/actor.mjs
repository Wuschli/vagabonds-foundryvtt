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

        // Make separate methods for each Actor type (character, npc, etc.) to keep
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

        systemData.attributes = {
            "might": { value: 0, methods: {} },
            "finesse": { value: 0, methods: {} },
            "wits": { value: 0, methods: {} },
            "heart": { value: 0, methods: {} }
        };

        // Loop through method scores, and calculate attribute scores.
        for (let [key, method] of Object.entries(systemData.methods)) {
            if (method.value > 0)
                systemData.attributes[method.attribute].value++;
        }

        const attributes = systemData.attributes;
        systemData.fatigue.max = attributes.might.value + attributes.finesse.value + attributes.wits.value + attributes.heart.value + (systemData.fatigue.bonus ?? 0);
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
        if (data.methods) {
            for (let [k, v] of Object.entries(data.methods)) {
                data[k] = v.value;
            }
        }
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

    async rollMethod(method, onDone = null) {

        // console.log(data);

        let d = await rolls.showActionRollDialog(this, method, onDone);
    }

    async rollAttribute(attribute, onDone = null) {

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

    async toggleTrauma(name) {
        let traumas = this.system.trauma;
        if (traumas.includes(name)) {
            const index = traumas.indexOf(name);
            traumas.splice(index, 1);
        }
        else {
            traumas.push(name);
        }
        await this.update({ system: { trauma: traumas } });
    }

    async usedMethod(method) {
        let update = { system: { methods: {} } };
        update.system.methods[method] = { used: true };
        await this.update(update);
    }

    async takeDamage(type, amount) {
        await this.gainFatigue(amount);
        if (this.system.fatigue.value < this.system.fatigue.max)
            return;

        if (type === 'physical') {
            return this.rollAttribute('might', (roll) => {
                if (roll.total <= 0)
                    this.rollGainWound();
            });
        }
        else if (type === 'mental') {
            return this.rollAttribute('wits');
        }
    }

    async rollGainWound() {
        const tables = game.packs.get('vagabonds-in-the-wilds.tables');
        const woundTable = await tables.getDocument("hUnpjrpOydidZ9yU");
        const roll = new Roll(`${this.system.wounds + 1}d6`);
        const woundResult = await woundTable.draw({ roll });
        // console.log(woundResult);
        for (const r of woundResult.results) {
            if (r.documentCollection === "Item") {
                const item = game.items.get(r.documentId);
                // console.log(item);
                await this.createEmbeddedDocuments('Item', [item]);
            }
        }
        return woundResult;
    }
}