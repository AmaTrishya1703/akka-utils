import type { CommandDefinition } from "@akka-bot/sdk";
import { clampToSafeInteger } from "./helpers";

const randomCommand: CommandDefinition = {
  name: "Random",
  description: "Menghasilkan angka acak antara min dan max (default 1-100)",
  usage: ".random [min] [max]",
  async handle(ctx) {
    try {
      let min = 1;
      let max = 100;

      if (ctx.args.length > 2) {
        await ctx.send("❌ Error: Maksimal hanya menerima 2 argumen untuk .random (min dan max).");
        return;
      }

      if (ctx.args.length === 1) {
        max = clampToSafeInteger(Number(ctx.args[0]));
      } else if (ctx.args.length === 2) {
        min = clampToSafeInteger(Number(ctx.args[0]));
        max = clampToSafeInteger(Number(ctx.args[1]));
      }

      if (min > max) {
        [min, max] = [max, min];
      }

      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      await ctx.send(randomNum.toString());
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default randomCommand;
