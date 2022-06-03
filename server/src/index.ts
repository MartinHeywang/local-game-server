import express from "express";
import cors from "cors";
import ip from "ip";
import { playersRouter } from "./players";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/players", playersRouter);

const PORT = 5000;
const HOSTNAME = ip.address();

app.get("/", (_, res) => res.sendStatus(200));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`http://${HOSTNAME}:${PORT}/`);
});
