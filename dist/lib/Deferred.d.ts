export declare type deferredPromise = Promise<any>;
declare class Deferred {
    resolve: Function;
    reject: Function;
    promise: deferredPromise;
    constructor();
}
export default Deferred;
