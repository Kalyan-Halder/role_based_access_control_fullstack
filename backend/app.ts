import dotenv from "dotenv";
dotenv.config({ path: "./config.env" }); // load env FIRST

import express, { Application } from "express";
import cors from "cors";
import router from "./router/routes";
import "./utils/connection";
import { errorHandler, notFound } from "./utils/errors";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

const port: number = parseInt(process.env.PORT || "5000");
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
