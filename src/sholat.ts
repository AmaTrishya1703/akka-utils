import type { CommandDefinition } from "@akka-bot/sdk";

type AdhanResponse = {
  data?: {
    timings?: Record<string, string>;
    date?: { readable?: string };
    meta?: { timezone?: string };
  };
};

const sholatCommand: CommandDefinition = {
  name: "Sholat",
  description: "Cek jadwal waktu sholat 5 waktu untuk suatu kota hari ini",
  usage: ".sholat [nama_kota]\n.sholat [nama_kota], [negara]",
  async handle(ctx) {
    try {
      const raw = ctx.args.join(" ").trim();
      if (!raw) {
        await ctx.send("❌ Error: Masukkan nama kota.");
        return;
      }

      const [cityPart, countryPart] = raw.split(",").map((part) => part.trim());
      const city = cityPart;
      const country = countryPart || "Indonesia";

      const res = await ctx.fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`
      );

      if (!res.ok) {
        await ctx.send("Kota tidak dikenali. Coba format: .sholat Kota, Negara");
        return;
      }

      const data = (await res.json()) as AdhanResponse;
      const timings = data.data?.timings;

      if (!timings) {
        await ctx.send("Kota tidak dikenali. Coba format: .sholat Kota, Negara");
        return;
      }

      const date = data.data?.date?.readable || new Date().toLocaleDateString("id-ID");
      await ctx.send(
        `🕌 Jadwal Sholat ${city} (${date}) — Subuh ${timings.Fajr ?? "-"}, Dzuhur ${timings.Dhuhr ?? "-"}, Ashar ${timings.Asr ?? "-"}, Maghrib ${timings.Maghrib ?? "-"}, Isya ${timings.Isha ?? "-"}`
      );
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default sholatCommand;
