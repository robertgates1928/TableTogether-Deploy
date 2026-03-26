import { Database } from "better-sqlite3"
import { Nullable } from "tough-cookie";

// "id", "privateName", "privateEmail", "privateAge", "password", "profileName", "hubMemberships"

export interface NewUser {
    profileName: string,
}

export interface UserRecord {
    id: number | bigint,
    profileName: string
}

// Model class for interacting with the cats
export class Users {
    db: Database

    constructor(db: Database) {
        this.db = db
    }

    // Run first to make sure the table is in good shape
    init() {
        // Auto increment from 1
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTO INC,
                profile_name TEXT NOT NULL UNIQUE
            );`);
    }

    listUsers(): UserRecord[] {
        return this.db.prepare(`
            SELECT 
                user_id as id
                profile_name as profileName
            FROM 
                users;
        `).all() as UserRecord[]
    }

    userWithId(id: number): Nullable<UserRecord> {
        return this.db.prepare(`
            SELECT 
                user_id as id,
                profile_name as profileName
            FROM 
                users
            WHERE user_id = ?`)
            .get(id) as Nullable<UserRecord>
    }

    newUser(user: NewUser): UserRecord {
        const lastId = this.db.prepare(`
                INSERT INTO users (profile_name)
                VALUES (?)
            `).run(user.profileName).lastInsertRowid;

        return {...user, id: lastId}
    }
}