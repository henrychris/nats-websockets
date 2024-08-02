import { connect, StringCodec, usernamePasswordAuthenticator } from "nats.ws";

const USER_ID = "678366e9-4a76-469d-9ebd-60b068312a87";
const SUBJECT = `user.notification.${USER_ID}`;
const STREAM_NAME = "UserNotificationStream";
const URL = "ws://localhost:8080";
const user = "limestone";
const password = "testlimestone123";

async function runSubscriber() {
    try {
        const nc = await connect({
            servers: URL,
            authenticator: new usernamePasswordAuthenticator(user, password),
        });
        console.log("Connected to NATS server");

        // create a codec
        const sc = StringCodec();

        // create a simple subscriber and iterate over messages
        // matching the subscription
        const sub = nc.subscribe(SUBJECT);
        console.log(`Subscribed to ${sub.getSubject()}`);

        // This will keep running and processing messages
        (async () => {
            for await (const m of sub) {
                console.log(`[${sub.getProcessed()}]: ${sc.decode(m.data)}`);
            }
            console.log("Subscription closed");
        })();

        // Handle disconnection
        nc.closed().then((err) => {
            if (err) {
                console.error(
                    `NATS connection closed due to error: ${err.message}`
                );
            } else {
                console.log("NATS connection closed");
            }
        });

        // Optional: Set up a way to gracefully shut down (e.g., on SIGINT)
        process.on("SIGINT", async () => {
            console.log("Shutting down...");
            await nc.drain();
            process.exit(0);
        });
    } catch (err) {
        console.error(`Error connecting to NATS: ${err.message}`);
    }
}

async function runConsumer() {
    try {
        const nc = await connect({
            servers: URL,
            authenticator: new usernamePasswordAuthenticator(user, password),
        });
        console.log("Connected to NATS server for JetStream.");

        // create a codec
        const sc = StringCodec();

        // create a jetstream context & create a consumer for the stream
        var js = nc.jetstream();
        var stream = await js.streams.get(STREAM_NAME);
        var consumer = await stream.getConsumer();

        console.log("Consuming messages...");

        // This will keep running and processing messages
        // from the stream.
        (async () => {
            for await (const m of await consumer.consume()) {
                console.log(sc.decode(m.data));
                m.ack();
            }
            console.log("Subscription closed");
        })();

        // Handle disconnection
        nc.closed().then((err) => {
            if (err) {
                console.error(
                    `NATS connection closed due to error: ${err.message}`
                );
            } else {
                console.log("NATS connection closed");
            }
        });
        // Optional: Set up a way to gracefully shut down (e.g., on SIGINT)
        process.on("SIGINT", async () => {
            console.log("Shutting down...");
            await nc.drain();
            process.exit(0);
        });
    } catch (err) {
        console.error(`Error connecting to NATS: ${err.message}`);
    }
}

// runConsumer();
runSubscriber();

// todo: add nats library method to publish to a topic string.
