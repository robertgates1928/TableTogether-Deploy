import Database from "better-sqlite3";

export interface NewUser {
    profileName: string,
}

export interface UserRecord {
    id: number | bigint,
    profileName: string
}

// Model class for interacting with users
export class Users {
    db: Database.Database

    constructor(db: Database.Database) {
        this.db = db

        // Init code
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_name TEXT NOT NULL
            );`);
    }

    listUsers(): UserRecord[] {
        return this.db.prepare(`
            SELECT 
                user_id as id,
                profile_name as profileName
            FROM 
                users;
        `).all() as UserRecord[]
    }

    userWithId(id: number): UserRecord | undefined {
        return this.db.prepare(`
            SELECT 
                user_id as id,
                profile_name as profileName
            FROM 
                users
            WHERE user_id = ?`)
            .get(id) as UserRecord | undefined
    }

    newUser(user: NewUser): UserRecord {
        const lastId = this.db.prepare(`
                INSERT INTO users (profile_name)
                VALUES (?)
            `).run(user.profileName).lastInsertRowid;

        return {...user, id: lastId}
    }
}