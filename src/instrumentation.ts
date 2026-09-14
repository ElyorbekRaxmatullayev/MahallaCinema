const globalForBot = global as unknown as { __botStarted?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalForBot.__botStarted) return;
  globalForBot.__botStarted = true;

  if (process.env.BOT_TOKEN) {
    const { startBot } = await import("@/lib/bot");
    startBot().catch((err) => console.error("[bot] fatal error:", err)); // fire-and-forget
  } else {
    console.warn("[bot] BOT_TOKEN not set — bot will not start, but scheduled sweeps still run");
  }

  // Independent of the bot: the no-show auto-cancel sweep must run either way.
  const { runSweep } = await import("@/lib/scheduler");
  setInterval(() => {
    runSweep().catch((err) => console.error("[scheduler] sweep failed:", err));
  }, 60_000);
}
