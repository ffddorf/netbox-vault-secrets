export type HTTPMethod = "GET" | "POST";

const VAULT_BASE_URL = "http://localhost:8082/";

export async function vaultRequest<Resp>(
  path: string,
  token: string,
  params?: { method?: HTTPMethod }
): Promise<Resp> {
  const url = new URL(path, VAULT_BASE_URL);
  const init: RequestInit = {
    method: params?.method || "GET",
    headers: {
      "X-Vault-Token": token,
    },
  };
  const resp = await fetch(url.toString(), init);
  if (!resp.ok) {
    throw new Error(`Invalid response: ${resp.status}`);
  }
  return resp.json();
}
