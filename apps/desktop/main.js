const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const iconPath = path.join(__dirname, process.platform === "win32" ? "icon.ico" : "icon.png");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0D1117",
    show: false,
    title: "StreamFlix",
    icon: iconPath,
    autoHideMenuBar: true,
  });

  win.once("ready-to-show", () => win.show());

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "web-build", "index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});