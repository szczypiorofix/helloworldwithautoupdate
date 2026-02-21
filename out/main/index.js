"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const electronUpdater = require("electron-updater");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    electron.dialog.showErrorBox("Błąd aktualizacji", err == null ? "nieznany błąd" : (err.stack || err).toString());
  });
  electronUpdater.autoUpdater.on("update-available", () => {
    electron.dialog.showMessageBox({ message: "Znalazłem aktualizację! Pobieram w tle..." });
  });
  electronUpdater.autoUpdater.on("update-not-available", () => {
    electron.dialog.showMessageBox({ message: "Brak aktualizacji. Masz najnowszą wersję." });
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    electron.dialog.showMessageBox({
      type: "info",
      title: "Aktualizacja gotowa",
      message: "Pobrano nową wersję. Aplikacja zostanie zrestartowana.",
      buttons: ["Zrestartuj"]
    }).then(() => {
      setImmediate(() => electronUpdater.autoUpdater.quitAndInstall());
    });
  });
  electronUpdater.autoUpdater.checkForUpdatesAndNotify();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
