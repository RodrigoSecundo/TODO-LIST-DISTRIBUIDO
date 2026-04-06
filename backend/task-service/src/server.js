import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const app = createApp();

async function start() {
  try {
    await prisma.$connect();
    app.listen(config.port, () => {
      console.log(`Task service listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start task service", error);
    process.exit(1);
  }
}

start();