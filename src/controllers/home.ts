import type { MojoContext } from '@mojojs/core';

export default class Controller {
    async index(ctx: MojoContext): Promise<void> {
        ctx.stash.title = 'TableTogether';
        ctx.stash.meetups = ctx.models.meetups.listMeetups();
        await ctx.render();
    }
}
