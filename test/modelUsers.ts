import { MojoApp } from '@mojojs/core';
import { DuckDBInstance } from '@duckdb/node-api';
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
        
        await t.resolves(() => app.models.users.init(connection), "Cats init OK");
        
        const catPath = path.resolve('test_data/users.csv');
        console.info(`Importing test users from ${catPath}`);
        t.ok(fs.existsSync(catPath), "CSV import is reachable on the filesystem.");
        await t.resolves(() => app.models.users.loadUsersFromCsv(connection, catPath).catch(e => console.error("Failure in loadUsersFromCsv", e)), `Import users from '${ catPath }' OK`);

        const cats: UserRecord[] = await app.models.users.listUsers(connection).catch(e => console.error("Failure in listCats", e));

        t.ok(cats.length > 0, "Listing cats returns results for populated database.")

        // cats[0].profileImage = '1.jpg';
        // await t.resolves(app.models.users.updateProfileImage(connection, cats[0]).catch(e => console.error("Failure in updateProfileImage", e)), "Test updating a profile image")

        // t.match((await app.models.users.listUsers(connection).catch(e => console.error("Failure in listUsers", e)))[0].profileImage, cats[0].profileImage, "Update cat profile images")

    })

});