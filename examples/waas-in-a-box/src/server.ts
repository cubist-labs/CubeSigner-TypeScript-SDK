import express from "express";
import register from "./routes/register_user.js";
import bodyParser from "body-parser";
import { join } from "path";

const app = express();
app.use(bodyParser.json());
app.post("/register", register);

const PORT = 3000;
const listening = () => console.log(`Listening on port ${PORT}`);

if (process.env.NODE_ENV === "production") {
  // In production, serve the client/dist folder
  app.use(express.static(join(import.meta.dirname, "../app/dist")));
  app.listen(PORT, listening);
} else {
  // In development, use Vite to serve the client
  const { default: ViteExpress } = await import("vite-express");
  ViteExpress.listen(app, PORT, listening);
}
