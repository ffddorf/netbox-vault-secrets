export type HTTPMethod = "GET" | "POST";

interface WrappedData<T> {
  data: T;
}

export interface TokenLookupSelf {
  accessor: string;
  creation_time: number;
  creation_ttl: number;
  display_name: string;
  entity_id: string;
  expire_time: string;
  explicit_max_ttl: number;
  id: string;
  identity_policies: string[];
  issue_time: string;
  meta: object;
  num_uses: number;
  orphan: boolean;
  path: string;
  policies: string[];
  renewable: boolean;
  ttl: number;
}

export interface ListSecrets {
  keys: string[];
}

export class VaultClient {
  constructor(private base_url: string, private token: string) {}

  private async request<R, B = null>(
    path: string,
    method?: HTTPMethod,
    body?: B
  ): Promise<R> {
    const url = new URL(path, this.base_url);
    const init: RequestInit = {
      method: method || "GET",
      headers: {
        "X-Vault-Token": this.token,
      },
    };
    if (body) {
      init.body = JSON.stringify(body);
    }

    const resp = await fetch(url.toString(), init);
    if (!resp.ok) {
      throw new Error(`Invalid response: ${resp.status}`);
    }

    return resp.json();
  }

  async tokenLookup(): Promise<TokenLookupSelf> {
    const info: WrappedData<TokenLookupSelf> = await this.request(
      "/v1/auth/token/lookup-self"
    );
    return info.data;
  }

  async listSecrets(path: string): Promise<ListSecrets> {
    const cleanPath = path.replace(/^\/+|\/+$/g, ""); // trims leading or trailing slashes
    const reqPath = `/v1/secret/metadata/${cleanPath}/?list=true`;
    const secrets: WrappedData<ListSecrets> = await this.request(reqPath);
    return secrets.data;
  }
}
