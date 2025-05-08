import { app } from '../lib/index.js';
import { UserRecord } from '../lib/models/users.js';
import t from 'tap';

import * as path from 'path';
import fs from 'fs';

app.log.level = 'debug';

// Database setup and hooks
app.config.database = ':memory:'
app.models.database.connectionString = ':memory:';

t.test('User Model', async t => {

    await app.models.database.connection(async connection => {
        
        await t.resolves(() => app.models.users.init(connection), "Users init OK");
        
        const userPath = path.resolve('test_data/users.csv');
        console.info(`Importing test users from ${userPath}`);
        t.ok(fs.existsSync(userPath), "CSV import is reachable on the filesystem.");
        await t.resolves(() => app.models.users.loadUsersFromCsv(connection, userPath).catch(e => console.error("Failure in loadUsersFromCsv", e)), `Import users from '${ userPath }' OK`);

        const users: UserRecord[] = await app.models.users.listUsers(connection).catch(e => console.error("Failure in listUsers", e));

        t.ok(users.length > 0, "Listing users returns results for populated database.")

    })

});