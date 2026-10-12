const { app, BrowserWindow } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 760,
    title: "GPS AI",
    autoHideMenuBar: true,
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
