import { env } from "../config.js";

type AIInput = {
  match_id: number;
  markets: string[];
  context: unknown;
};

export async function analyzeWithAI(input: AIInput) {
  if (!env.AI_API_KEY || !env.AI_MODEL) {
    return {
      configured: false,
      summary: "IA não configurada. Configure AI_API_KEY e AI_MODEL.",
      match_id: input.match_id,
      strongest_opportunities: [],
      avoid: []
    };
  }

  const system = `
Você é um analista quantitativo de futebol.
Não invente estatísticas.
Separe previsão do resultado da análise de mercados.
Para cada oportunidade siga:
TESE -> EVIDÊNCIAS -> CONTRAEVIDÊNCIAS -> PROBABILIDADE -> ODD -> EDGE -> RISCO -> DECISÃO.
Não trate odd baixa como segurança.
Se não houver valor suficiente, responda AVOID.
`;

  const response = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            match_id: input.match_id,
            markets: input.markets,
            context: input.context
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI provider ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as any;
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}
