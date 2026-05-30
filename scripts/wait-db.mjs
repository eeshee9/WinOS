// Polls TCP port 51218 until the Prisma dev server is accepting connections.
// Used by db:restart — runs after `prisma dev --detach` returns.
import { createConnection } from "net";

const PORT = 51218;
const HOST = "localhost";
const TIMEOUT_MS = 10_000;
const POLL_MS = 300;

const deadline = Date.now() + TIMEOUT_MS;

function probe() {
  const socket = createConnection(PORT, HOST);
  socket.on("connect", () => {
    socket.destroy();
    console.log(`[wait-db] port ${PORT} ready`);
    process.exit(0);
  });
  socket.on("error", () => {
    socket.destroy();
    if (Date.now() >= deadline) {
      console.error(`[wait-db] timed out waiting for port ${PORT}`);
      process.exit(1);
    }
    setTimeout(probe, POLL_MS);
  });
}

probe();
