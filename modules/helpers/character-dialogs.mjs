export const characterDialogs = {};

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
                    const amount = Number(html.find('#damage-amount')[0].value);

                    // console.log(type, amount);
                    await actor.takeDamage(amount);
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