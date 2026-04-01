import Database from "better-sqlite3";
import { Users } from "./models/users.js";

// Seed script for setting up development and testing data.
// Run with: npm run seed
// NOTE: This path must match the "database" value in config.yml

const DB_PATH = "hub.db";

const db = new Database(DB_PATH);
const users = new Users(db);

// Insert a default test user if none exist
const existing = users.listUsers();
if (existing.length === 0) {
    const testUser = users.newUser({ profileName: "TestUser" });
    console.info("Created test user:", testUser);
} else {
    console.info(`Database already has ${existing.length} user(s), skipping seed.`);
}

console.info("Seed complete.");
db.close();
