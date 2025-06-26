import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiCache from "apicache";
import errorHandler from "./middleware/errorHandler.js";
import localConfig from "./config/local.config.js";
import v1ApiRouter from "./api/v1/routes/task.routes.js";
import { swaggerDocs } from "./swagger/swagger.v1.js";
import recordRoutes from "./routes/recordRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import connectDB from "./config/database.js";
dotenv.config();

const AppConfig = localConfig.app;

const app = express();
// const cache = apiCache.middleware;

// app.use(cache("2 minutes"));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: AppConfig.clientHost,
  })
);

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//   next();
// });

// app.use("/api/v1", v1ApiRouter);

app.use("/api", recordRoutes);
app.use("/api", shareRoutes);

app.use(errorHandler);

function onInit() {
  swaggerDocs(app, AppConfig);
}

//just for testing
app.get("/", (req, res) => {
  res.send(`<h1>Backend is Running and this is '/' Route</h1>`);
});

connectDB();
app.listen(AppConfig.port, onInit);

export default app;
