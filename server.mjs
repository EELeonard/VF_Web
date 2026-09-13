import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

const shimUrl = new URL("./node-runtime/cloudflare-workers.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return { url: shimUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const cliUrl = new URL("./node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cliUrl), "start"];
await import(cliUrl.href);
