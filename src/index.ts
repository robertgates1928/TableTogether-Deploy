import mojo, { MojoApp, yamlConfigPlugin } from '@mojojs/core';

import { Database } from './models/database.js';
import { Users } from './models/users.js';

import fs from 'fs';

// Fill in empty config if missing
if (!fs.existsSync('config.yml')) createDefaultConfig();

// Mojo App
export const app: MojoApp = mojo();

app.plugin(yamlConfigPlugin);
app.secrets = app.config.secrets;


// model registration

app.models.database = new Database(app.config.database);
app.models.users = new Users(app.config.salt);

// Routing
app.get('/').to('example#welcome');



app.start();

// function for generating a valid configuration file if one is missing
function createDefaultConfig() {
    const passwordGen = () => {
        const passwordOptions = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$^&*()/?".split('')
        let secret = '';
        for (let i = 0; i < 16; i++) {
            secret += passwordOptions[Math.floor(Math.random() * passwordOptions.length)];
        }
        return secret
    }

    fs.writeFileSync('config.yml', `---
    secrets:
        - ${ passwordGen() }
    salt: ${ passwordGen() }
    database: "hub.db"`)
}