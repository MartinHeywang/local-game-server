export function initListenableValue<T>(arg: T) {
    type Listener = (value: T) => void;

    let value = arg;
    const listeners: Listener[] = [];

    function setValue(arg: T | ((old: T) => T)) {
        if (typeof arg === "function") {
            value = (arg as (old: T) => T)(value);
        } else {
            value = arg;
        }

        listeners.forEach(listener => listener(value));
    }

    function addListener(fn: Listener) {
        listeners.push(fn);
    }

    function removeListener(fn: Listener) {
        listeners.splice(listeners.indexOf(fn), 1);
    }

    const returnedTuple: [
        () => T,
        (val: T | ((old: T) => T)) => void,
        (fn: Listener) => void,
        (fn: Listener) => void
    ] = [() => value, setValue, addListener, removeListener];

    return returnedTuple;
}

export function initListenableArray<T>(array: T[]) {

}