import { app } from '../lib/index.js';
import t from 'tap';
import { existsSync } from "node:fs";
import fs from "node:fs/promises";

app.log.level = 'debug';

await t.test('File upload via /demo/upload', async t => {
    const ua = await app.newTestUserAgent({ tap: t });

    // Unauthenticated access should be blocked
    await t.test('upload form requires auth', async () => {
        (await ua.getOk('/demo/upload')).statusIs(302).headerLike('Location', /\/login/);
    });

    // Authenticate
    await ua.postOk('/login', { formData: { action: 'create', profileName: 'UploadTester' } });

    await t.test('upload form is accessible', async () => {
        (await ua.getOk('/demo/upload')).statusIs(200).bodyLike(/Upload a File/);
    });

    await t.test('uploading a text file succeeds (htmx)', async () => {
        (await ua.postOk('/demo/upload', {
            headers: { 'HX-Request': 'true' },
            formData: { file: { content: 'Hello Mojo!', filename: 'test.txt' } }
        })).statusIs(200).bodyLike(/test\.txt/);
    });

    await t.test('uploading a binary file succeeds (htmx)', async () => {
        (await ua.postOk('/demo/upload', {
            headers: { 'HX-Request': 'true' },
            formData: { file: { content: Buffer.from([0x89, 0x50, 0x4e, 0x47]), filename: 'image.png' } }
        })).statusIs(200).bodyLike(/image\.png/);
    });

    await t.test('non-htmx upload redirects back to the form', async () => {
        (await ua.postOk('/demo/upload', {
            formData: { file: { content: 'fallback test', filename: 'fallback.txt' } }
        })).statusIs(302).headerLike('Location', /\/demo\/upload/);
    });

    // Verify files were written to the uploads directory
    await t.test('uploaded files exist on disk', async t => {
        t.ok(existsSync('uploads'), 'uploads directory was created');
        const files = await fs.readdir('uploads');
        t.ok(files.length >= 2, 'At least two files were saved');
    });

    // Verify uploaded files are accessible when authenticated
    await t.test('uploaded file is accessible when logged in', async () => {
        const files = await fs.readdir('uploads');
        (await ua.getOk(`/uploads/${files[0]}`)).statusIs(200);
    });

    // Delete an upload via htmx DELETE
    await t.test('upload page shows delete buttons', async () => {
        (await ua.getOk('/demo/upload')).statusIs(200).bodyLike(/hx-delete/);
    });

    await t.test('deleting an upload via htmx succeeds', async () => {
        // Use upload ID 1 (first upload created in this test session)
        (await ua.deleteOk('/demo/upload/1', {
            headers: { 'HX-Request': 'true' }
        })).statusIs(200);
    });

    await t.test('deleted upload no longer appears on the page', async () => {
        (await ua.getOk('/demo/upload')).statusIs(200).bodyUnlike(/upload-1"/);
    });

    // Directory traversal should not expose files outside of uploads/
    await t.test('directory traversal with ../ is blocked', async () => {
        (await ua.getOk('/uploads/..%2Fpackage.json')).statusIs(404);
    });

    await t.test('directory traversal with encoded ../ is blocked', async () => {
        (await ua.getOk('/uploads/%2e%2e%2fpackage.json')).statusIs(404);
    });

    await t.test('directory traversal with backslash is blocked', async () => {
        (await ua.getOk('/uploads/..%5Cpackage.json')).statusIs(404);
    });

    // Verify uploaded files are protected after logout
    await ua.getOk('/logout');
    await t.test('uploaded file is blocked after logout', async () => {
        const files = await fs.readdir('uploads');
        (await ua.getOk(`/uploads/${files[0]}`)).statusIs(302).headerLike('Location', /\/login/);
    });

    // Clean up test uploads
    await fs.rm('uploads', { recursive: true, force: true });

    await ua.stop();
});
