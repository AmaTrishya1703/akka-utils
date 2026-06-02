import type { CommandDefinition } from "@akka-bot/sdk";
import { truncateSentences } from "./helpers";

type WikiResponse = {
  type?: string;
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
};

async function fetchSummary(ctx: Parameters<CommandDefinition["handle"]>[0], base: string, topic: string) {
  return ctx.fetch(`${base}${encodeURIComponent(topic.replace(/\s+/g, "_"))}`);
}

const wikiCommand: CommandDefinition = {
  name: "Wiki",
  description: "Cari ringkasan artikel Wikipedia tentang suatu topik",
  usage: ".wiki [topik]",
  async handle(ctx) {
    try {
      const topic = ctx.args.join(" ").trim();
      if (!topic) {
        await ctx.send("❌ Error: Masukkan topik pencarian.");
        return;
      }

      const idRes = await fetchSummary(ctx, "https://id.wikipedia.org/api/rest_v1/page/summary/", topic);
      let data = (await idRes.json()) as WikiResponse;

      if (!idRes.ok || data.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
        const enRes = await fetchSummary(ctx, "https://en.wikipedia.org/api/rest_v1/page/summary/", topic);
        data = (await enRes.json()) as WikiResponse;
      }

      if (!data || data.type === "disambiguation") {
        await ctx.send("Topik ambigu, coba lebih spesifik.");
        return;
      }

      if (!data.extract) {
        await ctx.send("Topik tidak ditemukan.");
        return;
      }

      const summary = truncateSentences(data.extract, 4);
      const url = data.content_urls?.desktop?.page;
      await ctx.send(`${data.title ?? topic} — ${summary}${url ? `\n${url}` : ""}`);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default wikiCommand;
