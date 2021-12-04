export type HTTPMethod = "GET" | "POST" | "DELETE";

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

export interface SecretMetadata {
  cas_required: boolean;
  created_time: string;
  current_version: number;
  delete_version_after: string;
  max_versions: number;
  oldest_version: number;
  updated_time: string;
  custom_metadata: Record<string, string>;
  versions: Record<
    string,
    {
      created_time: string;
      deletion_time: string | "";
      destroyed: boolean;
    }
  >;
}

export interface SecretData {
  data: Record<string, string>;
  metadata: {
    created_time: string;
    custom_metadata: Record<string, string>;
    deletion_time: string | "";
    destroyed: boolean;
    version: number;
  };
}

interface SecretMetadataCreation {
  max_versions?: number;
  cas_required?: boolean;
  delete_version_after?: string;
  custom_metadata?: Record<string, string>;
}

interface SecretDataCreation {
  options?: {
    cas?: number;
  };
  data: Record<string, string>;
}

export interface SecretCreationResponse {
  created_time: string;
  custom_metadata: Record<string, string>;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}

export class NotFoundError extends Error {
  constructor() {
    super("Object not found in Vault");
  }
}

// removes leading and trailing slashes
const trimPath = (path: string): string => path.replace(/^\/+|\/+$/g, "");

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
      if (resp.status === 404) {
        throw new NotFoundError();
      }

      let errCause = "";
      try {
        const { errors }: { errors: string[] } = await resp.json();
        errCause = errors.join("\n");
      } catch (e) {}
      throw new Error(`${resp.statusText} (${resp.status}):\n${errCause}`);
    }

    if (resp.status === 200) {
      return resp.json();
    }
  }

  async tokenLookup(): Promise<TokenLookupSelf> {
    const info: WrappedData<TokenLookupSelf> = await this.request(
      "/v1/auth/token/lookup-self"
    );
    return info.data;
  }

  async listSecrets(path: string): Promise<ListSecrets> {
    const reqPath = `/v1/secret/metadata/${trimPath(path)}/?list=true`;
    const secrets: WrappedData<ListSecrets> = await this.request(reqPath);
    return secrets.data;
  }

  async secretMetadata(path: string): Promise<SecretMetadata> {
    const reqPath = `/v1/secret/metadata/${trimPath(path)}`;
    const meta: WrappedData<SecretMetadata> = await this.request(reqPath);
    return meta.data;
  }

  async secretData(path: string): Promise<SecretData> {
    const reqPath = `/v1/secret/data/${trimPath(path)}`;
    const data: WrappedData<SecretData> = await this.request(reqPath);
    return data.data;
  }

  async secretMetadataUpdate(
    path: string,
    meta: Record<string, string>
  ): Promise<void> {
    const metaReqPath = `/v1/secret/metadata/${trimPath(path)}`;
    await this.request<{}, SecretMetadataCreation>(metaReqPath, "POST", {
      custom_metadata: meta,
    });
  }

  async secretDataUpdate(
    path: string,
    data: Record<string, string>,
    version?: number
  ): Promise<SecretCreationResponse> {
    const dataReqPath = `/v1/secret/data/${trimPath(path)}`;
    const creation = await this.request<
      WrappedData<SecretCreationResponse>,
      SecretDataCreation
    >(dataReqPath, "POST", {
      options: { cas: version },
      data,
    });
    return creation.data;
  }

  async secretDelete(path: string): Promise<void> {
    const reqPath = `/v1/secret/metadata/${trimPath(path)}`;
    await this.request(reqPath, "DELETE");
  }
}
