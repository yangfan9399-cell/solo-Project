import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Create the Qwik City express middleware
const { router, notFound } = createQwikCity({ render, qwikCityPlan });

const app = express();

// Enable gzip compression
// app.use(compression());

// Static Asset Handler
app.use(express.static(join(__dirname, "..", "public")));

// Qwik City Router
app.use(router);

// 404 handler
app.use(notFound);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
