import { env } from "../config.js";

export class SportmonksProvider {
  private base = env.SPORTMONKS_BASE_URL;

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (!env.SPORTMONKS_API_TOKEN) {
      throw new Error("SPORTMONKS_API_TOKEN não configurado.");
    }

    const url = new URL(`${this.base}${path}`);
    url.searchParams.set("api_token", env.SPORTMONKS_API_TOKEN);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Sportmonks ${response.status}: ${body}`);
    }
    return response.json() as Promise<T>;
  }

  get<T = unknown>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, params);
  }
}

export const sportmonks = new SportmonksProvider();
