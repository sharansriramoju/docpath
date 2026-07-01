import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(compression());

app.use(
  "/api",
  createProxyMiddleware({
    target: "https://docpath-api-production.up.railway.app",
    changeOrigin: true,
    cookieDomainRewrite: "",
  }),
);

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
