#!/usr/bin/env node
// A TCP proxy that delays every chunk by a fixed latency in each direction,
// for trying the app over a slow connection in a real browser (the browser
// tooling here can abort requests but not slow them down).
//
//   node scripts/slow-proxy.ts <listen-port> <app-port> <delay-ms>
//
// Point one browser at the proxy and another straight at the app, then draw
// in both: a mark saved during a slow POST should still land once, in the
// next blank strip if someone else finished first.

import net from "node:net";

const [listen, target, delay] = process.argv.slice(2).map(Number);
if (!listen || !target || Number.isNaN(delay)) {
  console.error("usage: node scripts/slow-proxy.ts <listen-port> <app-port> <delay-ms>");
  process.exit(1);
}

net
  .createServer((client) => {
    const app = net.connect(target, "127.0.0.1");
    const relay = (from: net.Socket, to: net.Socket): void => {
      from.on("data", (chunk) => setTimeout(() => to.writable && to.write(chunk), delay));
      from.on("error", () => {});
    };
    relay(client, app);
    relay(app, client);
    const close = (): void => {
      setTimeout(() => {
        client.destroy();
        app.destroy();
      }, delay);
    };
    client.on("close", close);
    app.on("close", close);
  })
  .listen(listen, () => console.log(`localhost:${listen} -> :${target}, +${delay} ms each way`));
