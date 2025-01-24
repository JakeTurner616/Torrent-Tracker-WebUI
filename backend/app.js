import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// Root route
app.get("/", (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Welcome</title>
            </head>
            <body>
                <h1>Welcome to the API Server</h1>
                <p>Visit <a href="/api">/api</a> to see the list of API routes.</p>
            </body>
        </html>
    `);
});

// Mount API routes under /api
app.use("/api", routes);

// Centralized error handler
app.use(errorHandler);

export default app;