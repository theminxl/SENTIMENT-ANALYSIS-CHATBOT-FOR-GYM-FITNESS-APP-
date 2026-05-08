import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { cwd: () => string; env: Record<string, string | undefined> };

const userAgent = "MinalFitnessChatbot/1.0 (local development)";
let gpt2Model = "gpt2";
let hfToken = "";
const domainWords = [
  "fitness",
  "gym",
  "diet",
  "nutrition",
  "workout",
  "exercise",
  "training",
  "protein",
  "calorie",
  "health app",
  "fitness app",
  "gym app",
  "workout app",
];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function domainQuery(query: string) {
  const cleaned = query.replace(/[^\w\s&+-]/g, " ").replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();
  const hasDomain = domainWords.some((word) => lower.includes(word));
  return hasDomain ? cleaned : `${cleaned} fitness gym workout diet`;
}

async function fetchText(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
    if (!response.ok) return "";
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const text = await fetchText(url, timeoutMs);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function modelPath(model: string) {
  return model.split("/").map(encodeURIComponent).join("/");
}

async function readJsonBody(req: any) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 24_000) break;
  }

  try {
    return JSON.parse(body || "{}") as { prompt?: string; context?: string; title?: string };
  } catch {
    return {};
  }
}

function compactText(value: string, limit = 900) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function buildGpt2Prompt(prompt: string, context: string, title: string) {
  return compactText(
    [
      "MINAL GPT-2 fitness chatbot.",
      "Use this trained context for gym reviews, fitness apps, workout apps, diet, recovery, and safety.",
      `Context title: ${title || "Trained fitness answer"}.`,
      `Context: ${context}`,
      `User question: ${prompt}`,
      "Assistant answer:",
    ].join("\n"),
    1_400,
  );
}

function cleanGeneratedText(text: string) {
  const withoutPrompt = text
    .replace(/MINAL GPT-2 fitness chatbot\.[\s\S]*?Assistant answer:/i, "")
    .replace(/User question:[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const stopped = withoutPrompt.split(/\b(User|Context|Assistant|Question):/i)[0]?.trim() || withoutPrompt;
  return stopped.slice(0, 650).trim();
}

function localGpt2Fallback(prompt: string, context: string) {
  const topic = domainQuery(prompt);
  return compactText(
    `For ${topic}, the trained fitness knowledge points to this answer: ${context} Keep the reply practical: connect the review signal to one gym, diet, workout app, or recovery action, and avoid treating general coaching as medical advice.`,
    700,
  );
}

async function callHostedGpt2(prompt: string, context: string, title: string) {
  if (!hfToken) return null;

  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${modelPath(gpt2Model)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify({
      inputs: buildGpt2Prompt(prompt, context, title),
      parameters: {
        max_new_tokens: 90,
        return_full_text: false,
        temperature: 0.72,
        top_p: 0.9,
        repetition_penalty: 1.15,
      },
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hosted GPT-2 returned ${response.status}`);
  }

  const data = await response.json();
  const generated =
    Array.isArray(data) && typeof data[0]?.generated_text === "string"
      ? data[0].generated_text
      : typeof data?.generated_text === "string"
        ? data.generated_text
        : "";

  return cleanGeneratedText(generated);
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

async function googleNews(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:30d`)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const xml = await fetchText(url);
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.slice(0, 4).map((item) => ({
    title: tag(item, "title"),
    url: tag(item, "link"),
    source: tag(item, "source") || "Google News",
    snippet: tag(item, "description"),
    publishedAt: tag(item, "pubDate"),
    kind: "news",
  }));
}

async function wikipedia(query: string) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=opensearch" +
    `&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json`;
  const data = (await fetchJson(url)) as [string, string[], string[], string[]] | null;
  if (!Array.isArray(data)) return [];
  const [, titles = [], snippets = [], urls = []] = data;

  return titles.map((title, index) => ({
    title,
    url: urls[index],
    source: "Wikipedia",
    snippet: snippets[index],
    kind: "reference",
  }));
}

async function openFoodFacts(query: string) {
  if (!/\b(diet|nutrition|food|meal|snack|protein|calorie|carb|fat|supplement|bar)\b/i.test(query)) {
    return [];
  }

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl" +
    `?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=4` +
    "&fields=product_name,brands,nutriscore_grade,nutriments,url,categories";
  const data = (await fetchJson(url)) as { products?: Array<Record<string, unknown>> } | null;
  const products = Array.isArray(data?.products) ? data.products : [];

  return products
    .map((product) => {
      const nutriments = (product.nutriments ?? {}) as Record<string, number>;
      const protein = Number(nutriments.proteins_100g ?? nutriments.proteins ?? 0);
      const calories = Number(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 0);
      const title = [product.product_name, product.brands].filter(Boolean).join(" - ");
      return {
        title: title || "Food product",
        url: String(product.url || "https://world.openfoodfacts.org"),
        source: "Open Food Facts",
        snippet: `Nutri-Score ${String(product.nutriscore_grade || "unknown").toUpperCase()}; ${protein ? `${protein}g protein/100g` : "protein not listed"}; ${calories ? `${Math.round(calories)} kcal/100g` : "calories not listed"}.`,
        kind: "nutrition",
      };
    })
    .filter((source) => source.title !== "Food product");
}

function buildSummary(query: string, sources: Array<{ title: string; source: string; snippet?: string; publishedAt?: string; kind?: string }>) {
  if (!sources.length) {
    return `No strong live web result came back for "${query}". Keep using the trained local gym, diet, workout, and app review knowledge, then try a more specific web query.`;
  }

  const news = sources.filter((source) => source.kind === "news").slice(0, 2);
  const nutrition = sources.find((source) => source.kind === "nutrition");
  const reference = sources.find((source) => source.kind === "reference");
  const parts = [];

  if (news.length) {
    parts.push(`Recent web items mention ${news.map((item) => item.title).join("; ")}.`);
  }
  if (nutrition) {
    parts.push(`Nutrition lookup found ${nutrition.title}: ${nutrition.snippet}`);
  }
  if (reference) {
    parts.push(`Reference context: ${reference.title}${reference.snippet ? ` - ${reference.snippet}` : ""}.`);
  }

  return parts.join(" ") || `Live sources were found for "${query}", but they need manual review before acting on them.`;
}

function liveWebMiddleware() {
  return async (
    req: any,
    res: any,
    next: () => void,
  ) => {
    const requestUrl = req.url ?? "";
    if (!requestUrl.startsWith("/api/live-web")) {
      next();
      return;
    }

    const url = new URL(requestUrl, "http://127.0.0.1");
    const rawQuery = (url.searchParams.get("query") ?? "").slice(0, 160);
    if (!rawQuery.trim()) {
      json(res, 400, { error: "Missing query" });
      return;
    }

    const query = domainQuery(rawQuery);

    try {
      const results = await Promise.allSettled([googleNews(query), wikipedia(query), openFoodFacts(query)]);
      const sources = results
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .filter((source) => source.title && source.url)
        .slice(0, 10);

      json(res, 200, {
        query,
        fetchedAt: new Date().toISOString(),
        summary: buildSummary(query, sources),
        sources,
      });
    } catch {
      json(res, 500, { error: "Live web fetch failed" });
    }
  };
}

function gpt2Middleware() {
  return async (req: any, res: any, next: () => void) => {
    const requestUrl = req.url ?? "";
    if (!requestUrl.startsWith("/api/gpt2")) {
      next();
      return;
    }

    if (req.method !== "POST") {
      json(res, 405, { error: "Use POST for GPT-2 generation" });
      return;
    }

    const body = await readJsonBody(req);
    const prompt = compactText(body.prompt ?? "", 500);
    const context = compactText(body.context ?? "", 1_200);
    const title = compactText(body.title ?? "", 120);

    if (!prompt || !context) {
      json(res, 400, { error: "Missing prompt or context" });
      return;
    }

    if (!hfToken) {
      json(res, 200, {
        generatedText: localGpt2Fallback(prompt, context),
        model: gpt2Model,
        provider: "local-fallback",
        configured: false,
      });
      return;
    }

    try {
      const generatedText = await callHostedGpt2(prompt, context, title);
      json(res, 200, {
        generatedText: generatedText || localGpt2Fallback(prompt, context),
        model: gpt2Model,
        provider: "huggingface",
        configured: true,
      });
    } catch (error) {
      json(res, 200, {
        generatedText: localGpt2Fallback(prompt, context),
        model: gpt2Model,
        provider: "local-fallback",
        configured: false,
        error: error instanceof Error ? error.message : "GPT-2 request failed",
      });
    }
  };
}

function liveWebPlugin(): Plugin {
  return {
    name: "minal-live-web-api",
    configureServer(server) {
      server.middlewares.use(gpt2Middleware());
      server.middlewares.use(liveWebMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(gpt2Middleware());
      server.middlewares.use(liveWebMiddleware());
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  gpt2Model = env.HF_GPT2_MODEL || process.env.HF_GPT2_MODEL || "gpt2";
  hfToken =
    env.HF_TOKEN ||
    env.HUGGINGFACE_API_KEY ||
    env.HUGGINGFACEHUB_API_TOKEN ||
    process.env.HF_TOKEN ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HUGGINGFACEHUB_API_TOKEN ||
    "";

  return {
    plugins: [react(), liveWebPlugin()],
  };
});
