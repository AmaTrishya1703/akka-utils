import type { CommandDefinition } from "@akka-bot/sdk";

const QR_API = "https://api.qrserver.com/v1/create-qr-code/";

const qrCommand: CommandDefinition = {
  name: "QR",
  description: "Generate QR code dari teks atau URL",
  usage: ".qr [teks atau URL]",
  async handle(ctx) {
    try {
      const text = ctx.args.join(" ").trim();

      if (!text) {
        await ctx.send("❌ Error: Masukkan teks atau URL.");
        return;
      }

      if (text.length > 900) {
        await ctx.send("❌ Error: Teks terlalu panjang untuk dibuat QR code.");
        return;
      }

      const url = `${QR_API}?size=300x300&data=${encodeURIComponent(text)}&format=png`;
      await ctx.send(`🔲 QR code untuk: ${JSON.stringify(text)}\n${url}`);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default qrCommand;
