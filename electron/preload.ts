import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // future APIs
});
