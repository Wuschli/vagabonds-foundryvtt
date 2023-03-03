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
            if (d.result >= 5) ++_total;
            if (d.result == 6) ++_total;
        });
        return _total;
    }
    /** @override */
    get flavor() {
        let _successes = 0;
        let _partials = 0;
        this.results.forEach(d => {
            if (d.result == 5) ++_partials;
            if (d.result == 6) ++_successes;
        });
        return `${_successes} Successes and ${_partials} Partial Successes`;
    }

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/vagabonds-in-the-wilds/assets/dice/skull.png" />',
            2: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank.png" />',
            3: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank.png" />',
            4: '<img src="systems/vagabonds-in-the-wilds/assets/dice/blank.png" />',
            5: '<img src="systems/vagabonds-in-the-wilds/assets/dice/shield.png" />',
            6: '<img src="systems/vagabonds-in-the-wilds/assets/dice/sword.png" />'
        }[result.result];
    }

    /** @override */
    getResultCSS(result) {
        console.log(result);
        // let r = super.getResultCSS(result);
        let r = ['vagabondsdie', 'd6'];
        if (result.result == 5)
            r.push('partial');
        if (result.result == 6)
            r.push('success');
        console.log(r);
        return r;
    }
}

export class VagabondsRoll extends Roll {
    constructor(...args) {
        super(...args);
        this._successes = 0;
        this._partials = 0;
    }

    /** @override */
    get result() {
        return `${this._successes} Successes and ${this._partials} Partial Successes`;
    }

    // /** @override */
    // get total() {
    //     return this._partials + this._successes * 2;
    // }

    // /** @override */
    // evaluate(options) {
    //     let result = super.evaluate(options);
    //     let self = this;
    //     this.terms.forEach(d => {
    //         d.partials = 0;
    //         d.successes = 0;

    //         d.results.forEach(r => {
    //             if (r.result == 5) ++d.partials;
    //             if (r.result == 6) ++d.successes;
    //         });
    //         // d.total = d.partials + d.successes * 2;
    //     });
    //     return result;
    // }
}