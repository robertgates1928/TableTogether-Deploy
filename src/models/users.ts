import { DuckDBConnection, DuckDBValue } from "@duckdb/node-api";
import { get, zipToObject, omit } from "radashi"
import { Nullable } from "tough-cookie";

// "id", "privateName", "privateEmail", "privateAge", "password", "profileName", "hubMemberships"

export interface NewUser {
    privateName: string,
    privateEmail: string,
    privateAge: number,
    password: string,
    profileName: string,
    hubMemberships: string[],
}

export interface UserRecord {
    id: number,
    privateName: string,
    privateEmail: string,
    privateAge: number,
    profileName: string,
    hubMemberships: string[],
}

// Model class for interacting with the cats
export class Users {

    constructor(private salt: string) { }

    // Run first to make sure the table is in good shape
    async init(connection: DuckDBConnection) {
        // Auto increment from 1
        await connection.run(`
            CREATE SEQUENCE IF NOT EXISTS user_id_seq;

            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER DEFAULT nextval('user_id_seq') PRIMARY KEY,
                private_name VARCHAR NOT NULL,
                private_email VARCHAR NOT NULL UNIQUE,
                private_age INTEGER NOT NULL,
                password UBIGINT NOT NULL,
                profile_name VARCHAR NOT NULL,
                hub_memberships JSON
            );`);
    }

    // Use this method to load data for testing or demonstration
    async loadUsersFromCsv(connection: DuckDBConnection, csvPath: string) {
        // const importFromCSV = await connection.prepare(`
        //     INSERT INTO cat_profiles
        //         BY NAME SELECT * FROM read_csv($1)`
        //     );
        // importFromCSV.bind([csvPath]);
        // await importFromCSV.run();
        // The above good code seems to be failing (WHY!?) I guess it has to be like this for the node-api
        await connection.run(`
            INSERT OR IGNORE INTO users
            SELECT
                nextval('user_id_seq'),
                private_name,
                private_email,
                private_age,
                hash(concat(password, ?)) as password,
                profile_name,
                hub_memberships FROM '${csvPath}';
            `, [this.salt])
    }


    async listUsers(connection: DuckDBConnection): Promise<UserRecord[]> {
        return connection.runAndReadAll(`
            SELECT 
                user_id as id,
                private_name as privateName,
                private_email as privateEmail,
                private_age as privateAge,
                profile_name as profileName,
                hub_memberships as hubMemberships
            FROM 
                users;
        `).then(result => result.getRows()
            .map(row => rowToClass( row, ...result.columnNames() )
        ))
    }

    async userWithEmail(connection: DuckDBConnection, email: string): Promise<Nullable<UserRecord>> {
        return connection.runAndReadAll(`
            SELECT 
                user_id as id,
                private_name as privateName,
                private_email as privateEmail,
                private_age as privateAge,
                profile_name as profileName,
                hub_memberships as hubMemberships
            FROM 
                users
            WHERE private_email = $1`
        , [email]
        ).then(result => result.getRows().length > 0 
            ? rowToClass( result.getRows()[0], ...result.columnNames() )
            : null
        )
    }

    async userWithCredentials(connection: DuckDBConnection, email: string, password: string): Promise<Nullable<UserRecord>> {
        return connection.runAndReadAll(`
            SELECT 
                user_id as id,
                private_name as privateName,
                private_email as privateEmail,
                private_age as privateAge,
                profile_name as profileName,
                hub_memberships as hubMemberships
            FROM 
                users
            WHERE private_email = $1 AND password = hash(concat($2, $3))`
        , [email, password, this.salt]
        ).then(result => result.getRows().length > 0 
            ? rowToClass(result.getRows()[0], ...result.columnNames())
            : null
        )
    }

    async newUser(db: DuckDBConnection, user: NewUser): Promise<UserRecord> {
        const insert = await db.prepare(`
                INSERT INTO users (private_name, private_email, private_age, password, profile_name, hub_memberships)
                VALUES (?, ?, ?, ?, hash(concat(?, ?)), ?, ?)
                RETURNING (user_id);
            `);

        // Bind happy path values in bulk
        const values = ["privateName", "privateEmail", "privateAge", "password", "profileName", "hubMemberships"].map(k => get(user, k) as DuckDBValue);
        // Add the salt after the password
        values.splice(4, 0, this.salt);
        insert.bind(values);

        // Go!
        const reader = await insert.runAndReadAll();

        // Build and filter for the new object
        const userRecord = {
            id: reader.getRows()[0][0] as number,
            ...user
        };

        return omit(userRecord, ["password"])
    }

    async updatePassword(db: DuckDBConnection, userId: number, newPassword: string) {
        await db.run(
            `UPDATE users SET password = hash(concat($2, $3)) WHERE user_id = $1`,
            [userId, newPassword, this.salt]
        )
    }
}

// Return an object from a row by associating the values to the given keys. The object's type can be inferred by the calling context or provided as a generic parameter.
export function rowToClass<T>(row: DuckDBValue[], ...attributes: string[]): T {
    return zipToObject(attributes, row) as T
}