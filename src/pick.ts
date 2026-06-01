import { command } from "@akka-bot/sdk";

/**
 * Robust argument parser that supports single/double quotes for arguments with spaces.
 */
function parseArguments(message: string): string[] {
  const trimmed = message.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return [];

  const argsText = trimmed.substring(firstSpace).trim();
  const args: string[] = [];
  const regex = /"([^"]*)"|'([^']*)'|([^\s"']+)/g;
  let match;
  while ((match = regex.exec(argsText)) !== null) {
    const val = match[1] !== undefined ? match[1] : (match[2] !== undefined ? match[2] : match[3]);
    if (val !== undefined) {
      args.push(val);
    }
  }
  return args;
}

export default command({
  name: "Pick",
  description: "Memilih item secara acak dari daftar pilihan",
  usage: ".pick [item1] [item2] ...",
  async handle(ctx) {
    try {
      // Menggunakan parser kustom untuk mendukung tanda kutip pada item berspasi
      const items = parseArguments(ctx.message);

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
});
