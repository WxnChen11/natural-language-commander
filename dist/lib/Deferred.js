"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.default = Deferred;
//# sourceMappingURL=Deferred.js.map