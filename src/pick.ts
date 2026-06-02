import type { CommandDefinition } from "@akka-bot/sdk";
import { parseQuotedArgs } from "./helpers";

const pickCommand: CommandDefinition = {
  name: "Pick",
  description: "Memilih item secara acak dari daftar pilihan",
  usage: ".pick [item1] [item2] ...",
  async handle(ctx) {
    try {
      const items = parseQuotedArgs(ctx.message);

      if (items.length < 2) {
        await ctx.send("❌ Error: Masukkan minimal 2 pilihan.");
        return;
      }

      if (items.length > 50) {
        await ctx.send("❌ Error: Maksimal pilihan adalah 50 item.");
        return;
      }

      const randomIndex = Math.floor(Math.random() * items.length);
      const chosenItem = items[randomIndex]!;

      await ctx.send(chosenItem);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default pickCommand;
