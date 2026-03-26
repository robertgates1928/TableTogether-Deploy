import mojo, { MojoApp, yamlConfigPlugin } from '@mojojs/core';

import Database from "better-sqlite3";
import { Users } from './models/users.js';

import fs from 'fs';

// Fill in empty config if missing
if (!fs.existsSync('config.yml')) createDefaultConfig();

// Mojo App
export const app: MojoApp = mojo();

app.plugin(yamlConfigPlugin);
app.secrets = app.config.secrets;

// DB Connect
const db = new Database(app.config.dat)

// model registration
app.models.users = new Users(db);

// Routing
app.get('/').to('example#welcome');



app.start();

// function for generating a valid configuration file if one is missing
function createDefaultConfig() {
    const passwordGen = () => {
        // This is a stand in for a password generator. This is generating the key used to encrypt the sessions handed out to users.
        const passwordOptions = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$^&*()/?".split('')
        let secret = '';
        for (let i = 0; i < 16; i++) {
            secret += passwordOptions[Math.floor(Math.random() * passwordOptions.length)];
        }
        return secret
    }

    // Just using text formatting to layout the simple yaml file
    // This is ok for atomic values, but is problematic if you try to include a datastructure
    // Any keys added here can be accesses by app.config.secrets
    fs.writeFileSync('config.yml', `---
    secrets:
        - ${ passwordGen() }
    database: "hub.db"`)
}