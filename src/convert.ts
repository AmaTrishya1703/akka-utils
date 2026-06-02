import type { CommandDefinition } from "@akka-bot/sdk";
import { formatNumber } from "./helpers";

// Faktor konversi ke satuan dasar (Meter untuk panjang, Gram untuk massa)
const lengthUnits: Record<string, number> = {
  pm: 1e-12,
  nm: 1e-9,
  um: 1e-6,
  mm: 1e-3,
  cm: 1e-2,
  m: 1,
  km: 1e3,
};

const massUnits: Record<string, number> = {
  pg: 1e-12,
  ng: 1e-9,
  ug: 1e-6,
  mg: 1e-3,
  g: 1,
  kg: 1e3,
};

const tempUnits = new Set(["c", "f", "k"]);

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  if (lower === "μm") return "um";
  if (lower === "μg") return "ug";
  return lower;
}

function getUnitCategory(unit: string): "length" | "mass" | "temp" | null {
  if (unit in lengthUnits) return "length";
  if (unit in massUnits) return "mass";
  if (tempUnits.has(unit)) return "temp";
  return null;
}

function getUnitDisplayName(unit: string): string {
  if (unit === "c") return "°C";
  if (unit === "f") return "°F";
  if (unit === "k") return "K";
  if (unit === "um") return "μm";
  if (unit === "ug") return "μg";
  return unit;
}

const SUPPORTED_UNITS_TEXT = 
  "Satuan yang didukung:\n" +
  "📏 Panjang: pm, nm, um (μm), mm, cm, m, km\n" +
  "⚖️ Massa: pg, ng, ug (μg), mg, g, kg\n" +
  "🌡️ Suhu: c (C), f (F), k (K)";

const convertCommand: CommandDefinition = {
  name: "Convert",
  description: "Mengonversi satuan Panjang, Massa, dan Suhu",
  usage: ".convert [nilai] [dari] [ke]",
  async handle(ctx) {
    try {
      if (ctx.args.length !== 3) {
        await ctx.send(`❌ Penggunaan salah. Contoh:\n.convert 5 km m\n.convert 100 c k\n.convert 2 kg g`);
        return;
      }

      const [nilaiStr, dariStr, keStr] = ctx.args as [string, string, string];

      const valueNum = Number(nilaiStr);
      if (isNaN(valueNum)) {
        await ctx.send("❌ Error: Nilai input harus berupa angka yang valid.");
        return;
      }

      const fromUnit = normalizeUnit(dariStr);
      const toUnit = normalizeUnit(keStr);

      const fromCategory = getUnitCategory(fromUnit);
      const toCategory = getUnitCategory(toUnit);

      if (!fromCategory || !toCategory) {
        await ctx.send(`❌ Error: Satuan tidak dikenal.\n\n${SUPPORTED_UNITS_TEXT}`);
        return;
      }

      if (fromCategory !== toCategory) {
        await ctx.send("❌ Error: Satuan berbeda jenis");
        return;
      }

      // Validasi nilai negatif untuk Panjang & Massa
      if (fromCategory !== "temp" && valueNum < 0) {
        await ctx.send("❌ Error: Nilai untuk panjang atau massa tidak boleh negatif.");
        return;
      }

      let resultValue = 0;

      if (fromCategory === "length") {
        const valInMeter = valueNum * lengthUnits[fromUnit]!;
        resultValue = valInMeter / lengthUnits[toUnit]!;
      } else if (fromCategory === "mass") {
        const valInGram = valueNum * massUnits[fromUnit]!;
        resultValue = valInGram / massUnits[toUnit]!;
      } else if (fromCategory === "temp") {
        // Konversi suhu via Celsius sebagai mediator
        let tempInC = 0;
        if (fromUnit === "c") {
          tempInC = valueNum;
        } else if (fromUnit === "f") {
          tempInC = ((valueNum - 32) * 5) / 9;
        } else if (fromUnit === "k") {
          tempInC = valueNum - 273.15;
        }

        if (toUnit === "c") {
          resultValue = tempInC;
        } else if (toUnit === "f") {
          resultValue = (tempInC * 9) / 5 + 32;
        } else if (toUnit === "k") {
          resultValue = tempInC + 273.15;
        }
      }

      const formattedValue = formatNumber(resultValue, 4);

      const fromDisplay = getUnitDisplayName(fromUnit);
      const toDisplay = getUnitDisplayName(toUnit);

      await ctx.send(`${valueNum} ${fromDisplay} = ${formattedValue} ${toDisplay}`);
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export default convertCommand;
