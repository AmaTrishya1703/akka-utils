import type { CommandDefinition } from "@akka-bot/sdk";

const randomCommand: CommandDefinition = {
  name: "Random",
  description: "Menghasilkan angka acak antara min dan max (default 1-100)",
  usage: ".random [min] [max]",
  async handle(ctx) {
    try {
      let min = 1;
      let max = 100;

      if (ctx.args.length > 0) {
        if (ctx.args.length > 2) {
          await ctx.send("❌ Error: Maksimal hanya menerima 2 argumen untuk .random (min dan max).");
          return;
        }

        const parsedArgs = ctx.args.map((arg) => {
          const num = Number(arg);
          if (isNaN(num)) {
            throw new Error(`Argumen '${arg}' bukan angka yang valid.`);
          }
          if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Angka '${arg}' terlalu besar (melebihi batas maksimal aman).`);
          }
          return Math.floor(num);
        });

        if (parsedArgs.length === 1) {
          min = 1;
          max = parsedArgs[0]!;
        } else {
          min = parsedArgs[0]!;
          max = parsedArgs[1]!;
        }
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
