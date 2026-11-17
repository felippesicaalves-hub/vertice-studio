// dev = gera/observa a safelist do Tailwind + roda o next dev
import { spawn } from "node:child_process";
const w = spawn(process.execPath, ["scripts/tw-safelist.mjs", "--watch"], { stdio: "inherit" });
const n = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)], { stdio: "inherit" });
const stop = () => { w.kill(); n.kill(); process.exit(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
n.on("exit", (code) => { w.kill(); process.exit(code ?? 0); });
