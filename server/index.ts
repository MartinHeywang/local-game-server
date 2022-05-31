import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 5000;
const HOSTNAME = "192.168.1.23";

let count = 0;
let countListeners: ((newValue: number) => void)[] = [];

function incrementCount() {
    count++;
    countListeners.forEach(fn => fn(count));
}
function addCountListener(cb: (newValue: number) => void) {
    countListeners.push(cb);
}
function rmCountListener(cb: (newValue: number) => void) {
    countListeners = countListeners.filter(fn => fn !== cb);
}

addCountListener((newValue) => console.log(`New Count Value: ${newValue}`));

app.get("/", (req, res) => {
    res.send("TypeScript With Express");
});

app.get("/watch", (_, res) => {

    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // flush the headers to establish SSE with client

    const listener = (newValue: number) => {
        res.write(newValue.toString());
    }

    addCountListener(listener);
    listener(count);

    // If client closes connection, stop sending events
    res.on("close", () => {
        rmCountListener(listener);
        res.end();
    });
});

app.get("/increment", (_, res) => {
    incrementCount();
    res.status(200).send("Done!");
});

app.get("/check-connection", (_, res) => {
    res.sendStatus(200);
})

app.listen(PORT, HOSTNAME, () => {
    console.log(`TypeScript with Express http://${HOSTNAME}:${PORT}/`);
});
