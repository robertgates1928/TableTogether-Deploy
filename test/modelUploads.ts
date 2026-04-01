import Database from 'better-sqlite3';
import { Users } from '../lib/models/users.js';
import { Uploads } from '../lib/models/uploads.js';
import t from 'tap';

t.test('Uploads Model (SQLite)', async t => {
    // Use an in-memory database for test isolation
    const db = new Database(':memory:');
    const users = new Users(db);
    const uploads = new Uploads(db);

    // Create a test user to link uploads to
    const user = users.newUser({ profileName: 'Uploader' });

    await t.test('listAllUploads returns empty array for fresh database', async t => {
        const result = uploads.listAllUploads();
        t.same(result, [], 'No uploads in a fresh database');
    });

    await t.test('insertUpload creates a record and returns it', async t => {
        const record = uploads.insertUpload(user.id, {
            field: 'file',
            fileName: 'photo.png',
            fileExt: '.png',
            savedPath: 'uploads/abc-123.png'
        });
        t.ok(record.id, 'Created upload has an id');
        t.same(record.fileName, 'photo.png', 'File name matches');
        t.same(record.userId, user.id, 'Upload is linked to the correct user');
    });

    await t.test('listAllUploads returns created uploads', async t => {
        const result = uploads.listAllUploads();
        t.equal(result.length, 1, 'One upload exists');
        t.same(result[0].fileName, 'photo.png', 'Listed upload matches created record');
    });

    await t.test('listUploadsForUser filters by user', async t => {
        // Create a second user and add an upload for them
        const otherUser = users.newUser({ profileName: 'SomeoneElse' });
        uploads.insertUpload(otherUser.id, {
            field: 'file',
            fileName: 'doc.pdf',
            fileExt: '.pdf',
            savedPath: 'uploads/def-456.pdf'
        });

        const forUploader = uploads.listUploadsForUser(user.id);
        t.equal(forUploader.length, 1, 'Only one upload for the first user');
        t.same(forUploader[0].fileName, 'photo.png', 'Correct file for the first user');

        const forOther = uploads.listUploadsForUser(otherUser.id);
        t.equal(forOther.length, 1, 'Only one upload for the second user');
        t.same(forOther[0].fileName, 'doc.pdf', 'Correct file for the second user');
    });

    db.close();
});
