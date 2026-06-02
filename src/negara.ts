import type { CommandDefinition } from "@akka-bot/sdk";

type Country = {
  cca2?: string;
  name: { common: string; official: string };
  capital?: string[];
  population?: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  idd?: { root?: string; suffixes?: string[] };
};

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function firstValue<T>(value: T[] | undefined): T | string {
  return value?.[0] ?? "-";
}

const negaraCommand: CommandDefinition = {
  name: "Negara",
  description: "Cari informasi umum tentang sebuah negara",
  usage: ".negara [nama_negara]",
  async handle(ctx) {
    try {
      const query = ctx.args.join(" ").trim();
      if (!query) {
        await ctx.send("❌ Error: Masukkan nama negara.");
        return;
      }

      const fields = "cca2,name,capital,population,languages,currencies,flags,idd,area";
      let res = await ctx.fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=${fields}`);

      if (!res.ok) {
        res = await ctx.fetch(`https://restcountries.com/v3.1/translation/${encodeURIComponent(query)}?fields=${fields}`);
      }

      if (!res.ok) {
        await ctx.send("Negara tidak ditemukan. Coba nama dalam bahasa Inggris.");
        return;
      }

      const countries = (await res.json()) as Country[];
      const country = countries[0];

      if (!country) {
        await ctx.send("Negara tidak ditemukan. Coba nama dalam bahasa Inggris.");
        return;
      }

      const common = country.name.common;
      const official = country.name.official;
      const capital = firstValue(country.capital);
      const population = country.population ? new Intl.NumberFormat("id-ID").format(country.population) : "-";
      const language = country.languages ? Object.values(country.languages)[0] ?? "-" : "-";
      const currency = country.currencies ? Object.values(country.currencies)[0] : undefined;
      const currencyText = currency ? `${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}` : "-";
      const phoneRoot = country.idd?.root ? `${country.idd.root}${country.idd.suffixes?.[0] ?? ""}` : "-";

      await ctx.send(
        `${country.cca2 ? `${flagEmoji(country.cca2)} ` : ""}${common} (${official}) | 🏙️ ${capital} | 👥 ${population} | 🗣️ ${language} | 💴 ${currencyText} | 📞 ${phoneRoot}`
      );
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default negaraCommand;
