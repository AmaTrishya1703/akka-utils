import type { CommandDefinition } from "@akka-bot/sdk";

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
};

type WeatherResponse = {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
};

function weatherLabel(code: number): string {
  if (code === 0) return "Cerah ☀️";
  if (code >= 1 && code <= 3) return "Berawan sebagian ⛅";
  if (code >= 45 && code <= 48) return "Berkabut 🌫️";
  if (code >= 51 && code <= 67) return "Gerimis / Hujan 🌧️";
  if (code >= 71 && code <= 77) return "Salju ❄️";
  if (code >= 80 && code <= 82) return "Hujan Lebat 🌧️";
  if (code >= 95 && code <= 99) return "Badai Petir ⛈️";
  return `Cuaca ${code}`;
}

const cuacaCommand: CommandDefinition = {
  name: "Cuaca",
  description: "Cek cuaca terkini suatu kota",
  usage: ".cuaca [nama_kota]",
  async handle(ctx) {
    try {
      const city = ctx.args.join(" ").trim();
      if (!city) {
        await ctx.send("❌ Error: Masukkan nama kota.");
        return;
      }

      const geoRes = await ctx.fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id`);
      if (!geoRes.ok) {
        await ctx.send("❌ Error: Gagal mencari kota.");
        return;
      }

      const geoData = (await geoRes.json()) as GeocodingResponse;
      const place = geoData.results?.[0];
      if (!place) {
        await ctx.send("Kota tidak ditemukan, coba nama lain.");
        return;
      }

      const weatherRes = await ctx.fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );

      if (!weatherRes.ok) {
        await ctx.send("❌ Error: Gagal mengambil data cuaca.");
        return;
      }

      const weatherData = (await weatherRes.json()) as WeatherResponse;
      const current = weatherData.current;

      if (!current) {
        await ctx.send("❌ Error: Data cuaca tidak tersedia.");
        return;
      }

      await ctx.send(
        `🌤️ ${place.name}, ${place.country} — ${current.temperature_2m}°C, ${weatherLabel(current.weather_code)} | 💧 ${current.relative_humidity_2m}% | 💨 ${current.wind_speed_10m} km/h`
      );
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default cuacaCommand;
