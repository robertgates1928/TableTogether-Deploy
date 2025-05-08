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

    // Test load and list
    await app.models.database.connection(async connection => {
        
        await t.resolves(() => app.models.users.init(connection), "Users init OK");
        
        const userPath = path.resolve('test_data/users.csv');
        console.info(`Importing test users from ${userPath}`);
        t.ok(fs.existsSync(userPath), "CSV import is reachable on the filesystem.");
        await t.resolves(() => app.models.users.loadUsersFromCsv(connection, userPath).catch(e => console.error("Failure in loadUsersFromCsv", e)), `Import users from '${ userPath }' OK`);

        const users: UserRecord[] = await app.models.users.listUsers(connection).catch(e => console.error("Failure in listUsers", e));

        t.ok(users.length > 0, "Listing users returns results for populated database.")

    })

    // Query by email
    const email = "jane.lin@test.com";
    const userJane = await app.models.database.run(c => app.models.users.userWithEmail(c, email));
    t.same(userJane.privateEmail, email, "User email matches query.");

    // Check password
    const importPassword = 'zIUJCUFTspUo';
    {
        const user = await app.models.database.run(c => app.models.users.userWithCredentials(c, email, importPassword));
        t.same(user.privateEmail, email, "User email matches credential query.");
    }

    // Check password failure (unchanged password)
    const newPassword = 'paswrod123';
    {
        const user = await app.models.database.run(c => app.models.users.userWithCredentials(c, email, newPassword));
        t.same(user, null, "User fails credential query.");
    }

    // Change Password
    {
        const user = await app.models.database.run(
            c => app.models.users.updatePassword(c, userJane.id, newPassword)
                .then(() => app.models.users.userWithCredentials(c, email, newPassword))
        );
        t.same(user.email, userJane.email, "User logs in with updated password.");
    }

});