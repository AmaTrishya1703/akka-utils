import type { CommandDefinition } from "@akka-bot/sdk";

const COMMON_CODES = "USD, IDR, EUR, SGD, JPY, GBP, AUD, CAD, CHF, CNY, MYR";

type FrankfurterRatesResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

function isCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

const kursCommand: CommandDefinition = {
  name: "Kurs",
  description: "Cek kurs mata uang terkini atau konversi nilai antar mata uang",
  usage: ".kurs [mata_uang_asal] [mata_uang_tujuan]\n.kurs [nilai] [mata_uang_asal] [mata_uang_tujuan]",
  async handle(ctx) {
    try {
      if (ctx.args.length < 2 || ctx.args.length > 3) {
        await ctx.send("❌ Penggunaan salah. Contoh:\n.kurs USD IDR\n.kurs 100 USD IDR");
        return;
      }

      let amount = 1;
      let from = ctx.args[0]!.toUpperCase();
      let to = ctx.args[1]!.toUpperCase();

      if (ctx.args.length === 3) {
        amount = Number(ctx.args[0]);
        from = ctx.args[1]!.toUpperCase();
        to = ctx.args[2]!.toUpperCase();
        if (!Number.isFinite(amount) || amount < 0) {
          await ctx.send("❌ Error: Nilai harus berupa angka non-negatif.");
          return;
        }
      }

      if (!isCurrencyCode(from) || !isCurrencyCode(to)) {
        await ctx.send(`❌ Error: Kode mata uang tidak dikenal. Gunakan kode umum seperti: ${COMMON_CODES}`);
        return;
      }

      if (from === to) {
        await ctx.send(`💱 ${formatIdr(amount)} ${from} = ${formatIdr(amount)} ${to}`);
        return;
      }

      const rateResponse = await ctx.fetch(`https://api.frankfurter.dev/v2/rate/${from}/${to}`);
      if (!rateResponse.ok) {
        await ctx.send("❌ Error: API kurs sedang bermasalah. Coba lagi nanti.");
        return;
      }

      const rateData = (await rateResponse.json()) as FrankfurterRatesResponse;
      const rate = rateData.rates[to];

      if (typeof rate !== "number") {
        await ctx.send(`❌ Error: Kurs ${from} ke ${to} tidak tersedia.`);
        return;
      }

      const converted = amount * rate;
      const dateText = rateData.date ? ` (per ${new Date(rateData.date + "T00:00:00Z").toLocaleDateString("id-ID")})` : "";
      await ctx.send(`💱 ${formatIdr(amount)} ${from} = ${formatIdr(converted)} ${to}${dateText}`);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default kursCommand;
