export class VagabondsDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = "v";

    /** @override */
    get total() {
        let _total = 0;
        this.results.forEach(d => {
            if (!d.active) return;
            if (d.result == 5) _total += 0.5;
            if (d.result == 6) _total += 1;
        });
        return _total;
    }
    // /** @override */
    // get flavor() {
    //     let _successes = 0;
    //     let _partials = 0;
    //     this.results.forEach(d => {
    //         if (d.result == 5) ++_partials;
    //         if (d.result == 6) ++_successes;
    //     });
    //     return `${_successes} Successes and ${_partials} Partial Successes`;
    // }

    /** @override */
    getResultLabel(result) {
        return {
            // 1: '<img src="systems/vagabonds-in-the-wilds/assets/dice/skull_chat.png" alt="1" title="1" />',
            // 2: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank_chat.png" alt="2" title="2" />',
            // 3: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank_chat.png" alt="3" title="3" />',
            // 4: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank_chat.png" alt="4" title="4" />',
            // 5: '<img src="systems/vagabonds-in-the-wilds/assets/dice/shield_chat.png" alt="5" title="5" />',
            // 6: '<img src="systems/vagabonds-in-the-wilds/assets/dice/sword_chat.png" alt="6" title="6" />'
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            5: '5',
            6: '6'
        }[result.result];
    }

    /** @override */
    getResultCSS(result) {
        // let r = super.getResultCSS(result);
        let r = ['vagabondsdie', 'd6'];
        if (result.discarded)
            r.push('discarded');
        else {
            if (result.result == 5)
                r.push('partial');
            if (result.result == 6)
                r.push('success');
        }
        return r;
    }
}