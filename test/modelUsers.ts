import Database from 'better-sqlite3';
import { Users } from '../lib/models/users.js';
import t from 'tap';

t.test('User Model (SQLite)', async t => {
    // Use an in-memory database for test isolation
    const db = new Database(':memory:');
    const users = new Users(db);

    await t.test('listUsers returns empty array for fresh database', async t => {
        const result = users.listUsers();
        t.same(result, [], 'No users in a fresh database');
    });

    await t.test('newUser creates a user and returns a record', async t => {
        const user = users.newUser({ profileName: 'Alice' });
        t.ok(user.id, 'Created user has an id');
        t.same(user.profileName, 'Alice', 'Profile name matches');
    });

    await t.test('listUsers returns created users', async t => {
        const result = users.listUsers();
        t.equal(result.length, 1, 'One user exists');
        t.same(result[0].profileName, 'Alice', 'Listed user matches created user');
    });

    await t.test('userWithId returns the correct user', async t => {
        const all = users.listUsers();
        const user = users.userWithId(all[0].id as number);
        t.ok(user, 'User found by id');
        t.same(user?.profileName, 'Alice', 'Profile name matches');
    });

    await t.test('userWithId returns undefined for non-existent id', async t => {
        const user = users.userWithId(9999);
        t.same(user, undefined, 'No user returned for bad id');
    });

    await t.test('multiple users can be created', async t => {
        users.newUser({ profileName: 'Bob' });
        users.newUser({ profileName: 'Charlie' });
        const result = users.listUsers();
        t.equal(result.length, 3, 'Three users exist');
    });

    db.close();
});
