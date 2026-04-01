import type {MojoContext} from '@mojojs/core';

export default class Controller {
  // Render the welcome page with the logged-in user's profile name
  async welcome(ctx: MojoContext): Promise<void> {
    await ctx.render();
  }
}
