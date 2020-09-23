declare module 'bunyan-logstash' {
    function createStream(options: { host: string; port: number });
}
