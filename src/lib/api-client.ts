const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const TENANT_DOMAIN = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "admin";

type Params = Record<string, string | number | boolean | undefined | null>;

interface Options extends Omit<RequestInit, "body"> {
  params?: Params;
  body?: unknown;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  token: string | undefined,
  options: Options = {},
): Promise<T> {
  const { params, body, headers: extraHeaders, ...rest } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Domain": TENANT_DOMAIN,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const res = await fetch(url, {
    ...rest,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
