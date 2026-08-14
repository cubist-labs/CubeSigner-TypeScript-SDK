import { delay } from "@cubist-labs/cubesigner-sdk";
import { readTestAndSet } from "../../src/locks";
import { BrowserStorageManager } from "../../";

declare global {
  interface Window {
    readTestAndSet: typeof readTestAndSet;
    delay: typeof delay;
    BrowserStorageManager: typeof BrowserStorageManager;
  }
}
window.delay = delay;
window.readTestAndSet = readTestAndSet;
window.BrowserStorageManager = BrowserStorageManager;
