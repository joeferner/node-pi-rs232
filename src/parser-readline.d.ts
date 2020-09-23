declare class ParserReadline {
    constructor(options: { delimiter: string });

    writable: boolean;

    write();

    end();

    addListener();

    on(event: 'data', fn: (line: string) => void);

    once();

    removeListener();

    off();

    removeAllListeners();

    setMaxListeners();

    getMaxListeners();

    listeners();

    rawListeners();

    emit();

    listenerCount();

    prependListener();

    prependOnceListener();

    eventNames();
}

declare namespace ParserReadline {}
declare module '@serialport/parser-readline' {
    export = ParserReadline;
}
