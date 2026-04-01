import Database from "better-sqlite3";
import { SavedFile } from "../fileStore.js";

export interface UploadRecord {
    id: number | bigint;
    userId: number | bigint;
    fileName: string;
    fileExt: string;
    savedPath: string;
}

// Model class for interacting with uploaded file records
export class Uploads {
    db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS uploads (
                upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_ext TEXT NOT NULL,
                saved_path TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );`);
    }

    // Store a file upload record linked to the user who uploaded it
    insertUpload(userId: number | bigint, file: SavedFile): UploadRecord {
        const lastId = this.db.prepare(`
            INSERT INTO uploads (user_id, file_name, file_ext, saved_path)
            VALUES (?, ?, ?, ?)
        `).run(userId, file.fileName, file.fileExt, file.savedPath).lastInsertRowid;

        return {
            id: lastId,
            userId,
            fileName: file.fileName,
            fileExt: file.fileExt,
            savedPath: file.savedPath
        };
    }

    // List all uploads for a specific user
    listUploadsForUser(userId: number | bigint): UploadRecord[] {
        return this.db.prepare(`
            SELECT
                upload_id as id,
                user_id as userId,
                file_name as fileName,
                file_ext as fileExt,
                saved_path as savedPath
            FROM uploads
            WHERE user_id = ?
            ORDER BY upload_id DESC
        `).all(userId) as UploadRecord[];
    }

    // List all uploads across all users
    listAllUploads(): UploadRecord[] {
        return this.db.prepare(`
            SELECT
                upload_id as id,
                user_id as userId,
                file_name as fileName,
                file_ext as fileExt,
                saved_path as savedPath
            FROM uploads
            ORDER BY upload_id DESC
        `).all() as UploadRecord[];
    }
}
