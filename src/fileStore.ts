import { MojoContext } from "@mojojs/core";
import path from 'node:path';
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";

// Metadata for a single saved file
export interface SavedFile {
    field: string;
    fileName: string;
    fileExt: string;
    savedPath: string;
}

// Save all uploaded files from a multipart form request.
// Files are renamed with a UUID to prevent collisions and path traversal.
export async function saveFiles(ctx: MojoContext, destinationDir: string): Promise<SavedFile[]> {
    await mkdir(destinationDir, { recursive: true });

    const saved: SavedFile[] = [];
    for await (const file of ctx.req.files()) {
        const fileExt = path.extname(file.filename);
        const savedPath = path.join(destinationDir, `${randomUUID()}${fileExt}`);

        // Pipe the upload stream to disk and wait for it to finish
        await pipeline(file.file, fs.createWriteStream(savedPath));

        saved.push({
            field: file.fieldname,
            fileName: file.filename,
            fileExt,
            savedPath
        });
    }

    return saved;
}

// Convenience wrapper for forms with a single file input.
// Returns the saved file metadata, or null if the named field was not present.
export async function saveFile(ctx: MojoContext, destinationDir: string, fieldName: string): Promise<SavedFile | null> {
    const files = await saveFiles(ctx, destinationDir);
    return files.find(f => f.field === fieldName) ?? null;
}
