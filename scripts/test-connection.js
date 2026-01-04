
const { MongoClient } = require('mongodb');

// URI from the user's .env (or pass as arg)
const uri = process.env.MONGODB_URI || "mongodb+srv://k3yt07:K3yt2299aaoc!@cluster0.r3l50vx.mongodb.net/?appName=Cluster0";

console.log("Testing connection to:", uri.replace(/:([^@]+)@/, ':****@'));

async function run() {
    const client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000
    });

    try {
        console.log("Attempting to connect...");
        await client.connect();
        console.log("Successfully connected!");

        const db = client.db('admin');
        const result = await db.command({ ping: 1 });
        console.log("Ping result:", result);

    } catch (err) {
        console.error("Connection failed!");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        if (err.cause) console.error("Cause:", err.cause);

        // Check for IP whitelist common error
        if (err.message.includes('ECONNRESET') || err.message.includes('connection timed out')) {
            console.log("\n--- TROUBLESHOOTING ---");
            console.log("This looks like a network or whitelist issue.");
            console.log("1. Go to MongoDB Atlas Dashboard.");
            console.log("2. Go to 'Network Access'.");
            console.log("3. Add your current IP address (or 0.0.0.0/0 for testing).");
        }
    } finally {
        await client.close();
    }
}

run();
