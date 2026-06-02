import type { CommandDefinition } from "@akka-bot/sdk";

type SurahListResponse = {
  data: Array<{ number: number; numberOfAyahs: number; englishName: string; name: string; englishNameTranslation: string }>;
};

type AyahResponse = {
  data?: Array<{ numberInSurah: number; text: string; number?: number; surah?: { name: string; englishName: string } }>;
};

function parseSurahInput(input: string): number | null {
  const num = Number(input);
  return Number.isInteger(num) ? num : null;
}

const quranCommand: CommandDefinition = {
  name: "Quran",
  description: "Baca ayat Al-Quran lengkap dengan teks Arab dan terjemahan Indonesia",
  usage: ".quran [nomor_surah] [nomor_ayat]\n.quran [nama_surah] [nomor_ayat]\n.quran random",
  async handle(ctx) {
    try {
      let surahArg = ctx.args[0];
      let ayatArg = ctx.args[1];

      if (ctx.args.length === 1 && ctx.args[0]?.toLowerCase() === "random") {
        const surahRes = await ctx.fetch("https://api.alquran.cloud/v1/surah");
        const surahData = (await surahRes.json()) as SurahListResponse;
        const randomSurah = surahData.data[Math.floor(Math.random() * surahData.data.length)];
        if (!randomSurah) {
          await ctx.send("❌ Error: Data surah tidak tersedia.");
          return;
        }
        const ayat = Math.floor(Math.random() * randomSurah.numberOfAyahs) + 1;
        surahArg = String(randomSurah.number);
        ayatArg = String(ayat);
      }

      if (!surahArg || !ayatArg) {
        await ctx.send("❌ Error: Gunakan format .quran [surah] [ayat] atau .quran random.");
        return;
      }

      const surahNum = parseSurahInput(surahArg);
      const ayatNum = parseSurahInput(ayatArg);

      if (ayatNum === null) {
        await ctx.send("❌ Error: Nomor ayat harus angka.");
        return;
      }

      const surahRes = await ctx.fetch("https://api.alquran.cloud/v1/surah");
      const surahData = (await surahRes.json()) as SurahListResponse;

      let surahNumber = surahNum;
      let surahInfo = surahData.data.find((item) => item.number === surahNumber);

      if (surahNumber === null) {
        surahInfo = surahData.data.find((item) => item.name.toLowerCase().includes(surahArg.toLowerCase()) || item.englishName.toLowerCase().includes(surahArg.toLowerCase()));
        if (!surahInfo) {
          await ctx.send("❌ Error: Nama surah tidak ditemukan.");
          return;
        }
        surahNumber = surahInfo.number;
      }

      if (!surahInfo) {
        await ctx.send("❌ Error: Nomor surah harus antara 1 dan 114.");
        return;
      }

      if (ayatNum > surahInfo.numberOfAyahs) {
        await ctx.send(`❌ Error: Surah tersebut hanya memiliki ${surahInfo.numberOfAyahs} ayat.`);
        return;
      }

      if (surahNumber < 1 || surahNumber > 114) {
        await ctx.send("❌ Error: Nomor surah harus antara 1 dan 114.");
        return;
      }

      const res = await ctx.fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayatNum}/editions/quran-uthmani,id.indonesian`);
      if (!res.ok) {
        await ctx.send("❌ Error: Gagal mengambil data Al-Quran.");
        return;
      }

      const data = (await res.json()) as AyahResponse;
      const arab = data.data?.[0];
      const indo = data.data?.[1];

      if (!arab || !indo) {
        await ctx.send("❌ Error: Ayat tidak ditemukan.");
        return;
      }

      await ctx.send(`📖 ${surahNumber}:${ayatNum}\n${arab.text}\n\n${indo.text}`);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default quranCommand;
