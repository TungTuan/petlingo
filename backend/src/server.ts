import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

app
  .listen({ port: env.PORT, host: env.HOST })
  .then((address) => {
    app.log.info(`🐾 PetLingo API listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

async function shutdown() {
  app.log.info("Shutting down...");
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
