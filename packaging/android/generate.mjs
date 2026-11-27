import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { ConsoleLog, TwaGenerator, TwaManifest } from "@bubblewrap/core";

const target = path.resolve("twa");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const manifest = await TwaManifest.fromWebManifest(
  "https://airmitra-app.vercel.app/manifest.webmanifest",
);
manifest.packageId = "app.airmitra.twa";
manifest.name = "AirMitra";
manifest.launcherName = "AirMitra";
manifest.appVersionCode = 2;
manifest.appVersionName = "1.0.1";
manifest.signingKey = { path: "./android.keystore", alias: "airmitra" };
manifest.generatorApp = "bubblewrap-cli";
manifest.enableNotifications = false;
manifest.minSdkVersion = 24;

await manifest.saveToFile(path.join(target, "twa-manifest.json"));
const generator = new TwaGenerator();
await generator.createTwaProject(target, manifest, new ConsoleLog("twa"));
console.log("TWA project generated at", target);
