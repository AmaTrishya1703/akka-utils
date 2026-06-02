import type { CommandDefinition } from "@akka-bot/sdk";
import { decodeHtmlEntities } from "./helpers";

type TriviaResponse = {
  response_code: number;
  results: Array<{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
};

const categoryMap: Record<string, number> = {
  sains: 17,
  komputer: 18,
  geografi: 22,
  sejarah: 23,
  umum: 9,
};

const pendingTrivia = new Map<string, { answer: string; question: string }>();

type TriviaResult = {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

function buildTriviaUrl(category?: number): string {
  return `https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986${category ? `&category=${category}` : ""}`;
}

async function fetchTriviaQuestion(ctx: Parameters<CommandDefinition["handle"]>[0], category?: number) {
  const url = buildTriviaUrl(category);
  const res = await ctx.fetch(url);

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as TriviaResponse;
  if (data.response_code === 5) {
    const retryRes = await ctx.fetch(url);
    if (!retryRes.ok) return null;
    return (await retryRes.json()) as TriviaResponse;
  }

  return data.response_code === 0 ? data : null;
}

const triviaCommand: CommandDefinition = {
  name: "Trivia",
  description: "Kuis trivia dengan pilihan ganda dari berbagai kategori",
  usage: ".trivia\n.trivia [kategori]",
  async handle(ctx) {
    try {
      const alias = ctx.args[0]?.toLowerCase();
      const category = alias ? categoryMap[alias] : undefined;
      const data = await fetchTriviaQuestion(ctx, category);

      if (!data) {
        await ctx.send("❌ Error: Trivia API sedang bermasalah.");
        return;
      }

      const question = data.results[0];
      if (!question) {
        await ctx.send("❌ Error: Soal trivia tidak tersedia.");
        return;
      }

      const answers = [question.correct_answer, ...question.incorrect_answers].map(decodeHtmlEntities);
      for (let i = answers.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j]!, answers[i]!];
      }

      const labels = ["A", "B", "C", "D"];
      const correctIndex = answers.findIndex((answer) => answer === decodeHtmlEntities(question.correct_answer));
      pendingTrivia.set(ctx.userId, { answer: labels[correctIndex]!, question: decodeHtmlEntities(question.question) });

      await ctx.send(
        `🎯 Trivia: ${decodeHtmlEntities(question.category)} — "${decodeHtmlEntities(question.question)}"\n${labels
          .map((label, index) => `${label}) ${answers[index]}`)
          .join("  ")}\n\nBalas dengan .jawab A/B/C/D`
      );
    } catch (error: any) {
      await ctx.send(`❌ Error: ${error.message}`);
    }
  },
};

export const jawabCommand: CommandDefinition = {
  name: "Jawab",
  description: "Menjawab trivia aktif",
  usage: ".jawab [A/B/C/D]",
  async handle(ctx) {
    const current = pendingTrivia.get(ctx.userId);
    if (!current) {
      await ctx.send("❌ Tidak ada trivia aktif. Ketik .trivia dulu.");
      return;
    }

    const answer = ctx.args[0]?.toUpperCase();
    if (!answer || !["A", "B", "C", "D"].includes(answer)) {
      await ctx.send("❌ Gunakan format .jawab A/B/C/D");
      return;
    }

    const correct = answer === current.answer;
    pendingTrivia.delete(ctx.userId);
    await ctx.send(correct ? `✅ Benar! Jawaban: ${current.question}` : `❌ Salah. Jawaban benar: ${current.answer}`);
  },
};

export default triviaCommand;
