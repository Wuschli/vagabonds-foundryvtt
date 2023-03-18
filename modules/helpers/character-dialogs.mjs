export const characterDialogs = {};

characterDialogs.showEndSessionDialog = async function (actor) {

    const template = 'systems/vagabonds-in-the-wilds/templates/dialog/end-session.hbs';
    const title = 'VAGABONDS.EndSession';
    const actorData = actor.sheet.getData();

    const data = { methods: {} };
    for (let [key, method] of Object.entries(actorData.system.methods)) {
        if (method.used && method.value < 4)
            data.methods[key] = method;
    };

    const contentHtml = await renderTemplate(template, data);

    const d = new Dialog({
        title: game.i18n.localize(title),
        content: contentHtml,
        buttons: {
            apply: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('VAGABONDS.Apply'),
                callback: async (html) => {
                    const method = html.find('#method')[0].value;

                    if (method != "none") {
                        let roll = new Roll("1d6cs>=5");
                        await roll.evaluate({ async: true });

                        roll.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: game.i18n.format("VAGABONDS.MethodImproveRoll", { method: game.i18n.localize(CONFIG.VAGABONDS.methods[method]) ?? method }),
                            rollMode: game.settings.get('core', 'rollMode'),
                        });

                        const update = { system: { methods: {} } };

                        for (let [key, method] of Object.entries(actorData.system.methods)) {
                            update.system.methods[key] = { used: false };
                        }

                        if (roll.total > 0 && actor.system.methods[method].value < 4) {
                            update.system.methods[method].value = actor.system.methods[method].value + 1;
                        }
                        await actor.update(update);
                    }
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('VAGABONDS.Cancel'),
                callback: (html) => { }
            }
        },
        default: "apply",
        close: () => { }
    });

    d.render(true);

    return d;
}

characterDialogs.showTakeDamageDialog = async function (actor) {

    const template = 'systems/vagabonds-in-the-wilds/templates/dialog/take-damage.hbs';
    const title = 'VAGABONDS.TakeDamage';
    const data = actor.sheet.getData();

    const contentHtml = await renderTemplate(template, data);

    const d = new Dialog({
        title: game.i18n.localize(title),
        content: contentHtml,
        buttons: {
            apply: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('VAGABONDS.Apply'),
                callback: async (html) => {
                    const type = html.find('input[name="damage-type"]:checked')[0].value;
                    const amount = Number(html.find('#damage-amount')[0].value);

                    // console.log(type, amount);
                    await actor.takeDamage(type, amount);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('VAGABONDS.Cancel'),
                callback: (html) => { }
            }
        },
        default: "apply",
        close: () => { }
    });

    d.render(true);

    return d;
}