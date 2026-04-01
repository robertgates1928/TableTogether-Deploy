import { app } from '../lib/index.js';
import t from 'tap';
import { existsSync } from "node:fs";
import fs from "node:fs/promises";

app.log.level = 'debug';

await t.test('File upload via /demo/upload', async t => {
    const ua = await app.newTestUserAgent({ tap: t });

    // Authenticate first so the auth hook doesn't redirect uploads
    await ua.postOk('/login', { formData: { action: 'create', profileName: 'UploadTester' } });

    await t.test('upload form is accessible', async () => {
        (await ua.getOk('/demo/upload')).statusIs(200).bodyLike(/Upload a File/);
    });

    await t.test('uploading a text file succeeds', async () => {
        (await ua.postOk('/demo/upload', {
            formData: { file: { content: 'Hello Mojo!', filename: 'test.txt' } }
        })).statusIs(200).bodyLike(/test\.txt/);
    });

    await t.test('uploading a binary file succeeds', async () => {
        (await ua.postOk('/demo/upload', {
            formData: { file: { content: Buffer.from([0x89, 0x50, 0x4e, 0x47]), filename: 'image.png' } }
        })).statusIs(200).bodyLike(/image\.png/);
    });

    // Verify files were written to the uploads directory
    await t.test('uploaded files exist on disk', async t => {
        t.ok(existsSync('uploads'), 'uploads directory was created');
        const files = await fs.readdir('uploads');
        t.ok(files.length >= 2, 'At least two files were saved');
    });

    // Clean up test uploads
    await fs.rm('uploads', { recursive: true, force: true });

    await ua.stop();
});
