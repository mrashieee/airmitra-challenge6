/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell, session } = require("electron");

const APP_URL = "https://airmitra-app.vercel.app";
const APP_ORIGIN = new URL(APP_URL).origin;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 920,
    minHeight: 640,
    title: "AirMitra",
    backgroundColor: "#f5f2e9",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.loadURL(APP_URL);

  // Keep the shell on the AirMitra origin; open everything else in the
  // user's browser instead of trapping them inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  // The app only needs location for "use my location". Everything else is
  // denied by default.
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowed =
        permission === "geolocation" &&
        webContents.getURL().startsWith(APP_ORIGIN);
      callback(allowed);
    },
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
