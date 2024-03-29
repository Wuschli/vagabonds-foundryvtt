export const rolls = {};

rolls.showRollDialog = async function (actor, data, template, title, getDiceCount, getFlavor, onDone = null) {
    const contentHtml = await renderTemplate(template, data);

    const d = new Dialog({
        title: game.i18n.localize(title),
        content: contentHtml,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('VAGABONDS.Roll'),
                callback: async (html) => {
                    let diceCount = getDiceCount(html);
                    const checkboxes = html.find('[type="checkbox"]').not('#push');
                    for (const c of checkboxes) {
                        if (c.checked)
                            diceCount += Number(c.value);
                    }
                    const bonus = Number(html.find('#bonus')[0].value);
                    diceCount += bonus;

                    const pushed = html.find('#push')[0]?.checked;
                    diceCount += pushed ? CONFIG.VAGABONDS.push.bonus : 0;

                    let formula = `${diceCount}dv`;
                    if (diceCount < 1)
                        formula = '2dvkl';
                    let roll = new Roll(formula);
                    await roll.evaluate({ async: true });
                    if (pushed) {
                        await actor.gainFatigue?.(CONFIG.VAGABONDS.push.fatigue);
                        actor.sheet.render();
                    }

                    // console.log(roll);
                    roll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: getFlavor(html),
                        rollMode: game.settings.get('core', 'rollMode'),
                    });
                    onDone?.(html, roll);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('VAGABONDS.Cancel'),
                callback: (html) => { }
            }
        },
        default: "roll",
        close: () => { }
    });

    d.render(true);

    return d;
};

rolls.showActionRollDialog = async function (actor, attribute, onDone = null) {

    const data = actor.sheet.getData();
    data.selectedAttribute = attribute;

    return this.showRollDialog(
        actor,
        data,
        'systems/vagabonds-in-the-wilds/templates/dialog/action-roll.hbs',
        'VAGABONDS.ActionRoll',
        (html) => {
            const attribute = html.find('#attribute')[0].value;
            return actor.system.attributes[attribute].value;
        },
        (html) => {
            const attribute = html.find('#attribute')[0].value;
            return game.i18n.format("VAGABONDS.AttributeActionRoll", { attribute: game.i18n.localize(CONFIG.VAGABONDS.attributes[attribute]) ?? attribute })
        },
        (html, roll) => {
            onDone?.(roll);
        }
    );
};

rolls.showSavingThrowDialog = async function (actor, attribute, onDone = null) {

    const data = actor.sheet.getData();
    data.selectedAttribute = attribute;

    return this.showRollDialog(
        actor,
        data,
        'systems/vagabonds-in-the-wilds/templates/dialog/saving-throw.hbs',
        'VAGABONDS.SavingThrow',
        (html) => {
            const attribute = html.find('#attribute')[0].value;
            return actor.system.attributes[attribute].value;
        },
        (html) => {
            const attribute = html.find('#attribute')[0].value;
            return game.i18n.format("VAGABONDS.AttributeSavingThrow", { attribute: game.i18n.localize(CONFIG.VAGABONDS.attributes[attribute]) ?? attribute })
        },
        (html, roll) => {
            onDone?.(roll);
        }
    );
};