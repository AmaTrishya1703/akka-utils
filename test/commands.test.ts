import { describe, it, expect } from "bun:test";
import randomCmd from "../src/random";
import pickCmd from "../src/pick";
import convertCmd from "../src/convert";
import { type CommandContext } from "@akka-bot/sdk";

// Helper to create a mock context
function createMockContext(
  args: string[],
  message: string,
  onSend: (text: string) => void | Promise<void>
): CommandContext {
  return {
    send: async (text: string) => {
      await onSend(text);
    },
    react: async () => {},
    schedule: async () => {},
    fetch: async () => new Response(),
    userId: "test_user",
    args,
    message,
    contactId: 1,
  };
}

describe("akka-utils commands", () => {
  describe(".random command", () => {
    it("should default to 1-100 if no arguments", async () => {
      let sentText = "";
      const ctx = createMockContext([], ".random", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      const val = Number(sentText);
      expect(isNaN(val)).toBe(false);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(100);
    });

    it("should work with custom min and max", async () => {
      let sentText = "";
      const ctx = createMockContext(["13", "50"], ".random 13 50", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      const val = Number(sentText);
      expect(isNaN(val)).toBe(false);
      expect(val).toBeGreaterThanOrEqual(13);
      expect(val).toBeLessThanOrEqual(50);
    });

    it("should swap automatically if min > max", async () => {
      let sentText = "";
      const ctx = createMockContext(["50", "13"], ".random 50 13", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      const val = Number(sentText);
      expect(isNaN(val)).toBe(false);
      expect(val).toBeGreaterThanOrEqual(13);
      expect(val).toBeLessThanOrEqual(50);
    });

    it("should handle 1 argument (1 to max)", async () => {
      let sentText = "";
      const ctx = createMockContext(["6"], ".random 6", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      const val = Number(sentText);
      expect(isNaN(val)).toBe(false);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    });

    it("should reject inputs that are not numbers", async () => {
      let sentText = "";
      const ctx = createMockContext(["abc", "50"], ".random abc 50", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("bukan angka yang valid");
    });

    it("should floor decimal numbers", async () => {
      let sentText = "";
      // 1.5 floored to 1, 6.9 floored to 6
      const ctx = createMockContext(["1.5", "6.9"], ".random 1.5 6.9", (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      const val = Number(sentText);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    });

    it("should reject numbers larger than safe integer limit", async () => {
      let sentText = "";
      const hugeNum = (Number.MAX_SAFE_INTEGER + 10).toString();
      const ctx = createMockContext(["1", hugeNum], `.random 1 ${hugeNum}`, (txt) => {
        sentText = txt;
      });

      await randomCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("terlaju besar"); // or spelling matching error
    });
  });

  describe(".pick command", () => {
    it("should select an item randomly from list", async () => {
      let sentText = "";
      const ctx = createMockContext(
        ["nasi", "mie", "lontong"],
        ".pick nasi mie lontong",
        (txt) => {
          sentText = txt;
        }
      );

      await pickCmd.handle(ctx);
      expect(["nasi", "mie", "lontong"]).toContain(sentText);
    });

    it("should parse quotes for items with spaces", async () => {
      let sentText = "";
      const ctx = createMockContext(
        ["\"nasi", "goreng\"", "soto", "bakso"],
        '.pick "nasi goreng" soto bakso',
        (txt) => {
          sentText = txt;
        }
      );

      await pickCmd.handle(ctx);
      expect(["nasi goreng", "soto", "bakso"]).toContain(sentText);
    });

    it("should throw error if less than 2 items", async () => {
      let sentText = "";
      const ctx = createMockContext(["nasi"], ".pick nasi", (txt) => {
        sentText = txt;
      });

      await pickCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("minimal 2 pilihan");
    });

    it("should throw error if more than 50 items", async () => {
      let sentText = "";
      const items = Array.from({ length: 51 }, (_, i) => `item${i}`);
      const ctx = createMockContext(items, `.pick ${items.join(" ")}`, (txt) => {
        sentText = txt;
      });

      await pickCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("Maksimal pilihan adalah 50 item");
    });
  });

  describe(".convert command", () => {
    it("should convert km to m", async () => {
      let sentText = "";
      const ctx = createMockContext(["5", "km", "m"], ".convert 5 km m", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("5 km = 5000 m");
    });

    it("should convert celsius to kelvin", async () => {
      let sentText = "";
      const ctx = createMockContext(["100", "c", "k"], ".convert 100 c k", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("100 °C = 373.15 K");
    });

    it("should convert kg to g", async () => {
      let sentText = "";
      const ctx = createMockContext(["2", "kg", "g"], ".convert 2 kg g", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("2 kg = 2000 g");
    });

    it("should display error for unknown units and list valid units", async () => {
      let sentText = "";
      const ctx = createMockContext(["5", "xyz", "m"], ".convert 5 xyz m", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("Satuan tidak dikenal");
      expect(sentText).toContain("Panjang");
      expect(sentText).toContain("Massa");
      expect(sentText).toContain("Suhu");
    });

    it("should reject cross-category conversion (e.g. km to kg)", async () => {
      let sentText = "";
      const ctx = createMockContext(["5", "km", "kg"], ".convert 5 km kg", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("❌ Error: Satuan berbeda jenis");
    });

    it("should allow negative values for temperature", async () => {
      let sentText = "";
      const ctx = createMockContext(["-10", "c", "k"], ".convert -10 c k", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("-10 °C = 263.15 K");
    });

    it("should reject negative values for length/mass", async () => {
      let sentText = "";
      const ctx = createMockContext(["-5", "m", "cm"], ".convert -5 m cm", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toContain("Error");
      expect(sentText).toContain("tidak boleh negatif");
    });

    it("should format decimal to max 4 decimal places and remove trailing zeros", async () => {
      let sentText = "";
      // 1.00005 m to mm should be 1.00005 * 1000 = 1000.05
      const ctx = createMockContext(["1.00005", "m", "mm"], ".convert 1.00005 m mm", (txt) => {
        sentText = txt;
      });

      await convertCmd.handle(ctx);
      expect(sentText).toBe("1.00005 m = 1000.05 mm");
    });
  });
});
