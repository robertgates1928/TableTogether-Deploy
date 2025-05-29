import { MojoContext } from "@mojojs/core";
import path from 'node:path';
import { mkdir } from "node:fs/promises";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

// Structure returned by saveFiles
export interface FileSet {
    field: string;
    fileName: string;
    fileExt: string;
    destinationPath: string;
}

export async function saveFiles(ctx: MojoContext, destinationPath: string): Promise<FileSet[]> {
    // Ensure destination path exists
    await mkdir(destinationPath, { recursive: true });

    const fileSet = [];
    for await(const file of ctx.req.files()) {
        // console.debug(file);
        const metadata = {
            field: file.fieldname,
            fileName: file.filename,
            fileExt: path.extname(file.filename),
            destinationPath: ''
        };
        metadata.destinationPath = path.join(destinationPath, `${ randomUUID() }${metadata.fileExt}`)
        fileSet.push(metadata);
        // console.debug(metadata)

        const writableStream = fs.createWriteStream(metadata.destinationPath);
        file.file.pipe(writableStream)
    }

    return fileSet
}