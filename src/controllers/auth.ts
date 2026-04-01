import type { MojoContext } from '@mojojs/core';
import { Users } from '../models/users.js';

export default class Controller {
    // Render the login page with a list of existing users and a form to create a new one
    async loginPage(ctx: MojoContext): Promise<void> {
        const users = (ctx.models.users as Users).listUsers();
        ctx.stash.users = users;
        await ctx.render();
    }

    // Handle login form submission (select existing user or create new)
    async loginAction(ctx: MojoContext): Promise<void> {
        const params = await ctx.params();
        const action = params.get('action');
        const usersModel = ctx.models.users as Users;
        const session = await ctx.session();

        if (action === 'select') {
            // Existing user selected
            const userId = Number(params.get('userId'));
            const user = usersModel.userWithId(userId);
            if (user == null) {
                await ctx.redirectTo('/login');
                return;
            }
            session.userId = user.id;
            session.profileName = user.profileName;
        } else if (action === 'create') {
            // Create a new test user
            const profileName = params.get('profileName')?.trim();
            if (!profileName) {
                await ctx.redirectTo('/login');
                return;
            }
            const user = usersModel.newUser({ profileName });
            session.userId = user.id;
            session.profileName = user.profileName;
        }

        await ctx.redirectTo('/');
    }

    // Clear session and redirect to login
    async logout(ctx: MojoContext): Promise<void> {
        const session = await ctx.session();
        delete session.userId;
        delete session.profileName;
        await ctx.redirectTo('/login');
    }
}
