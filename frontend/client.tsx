import { JSX, h, Fragment } from "preact";

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

export interface AuthUrl {
  auth_url: string;
}

export interface AuthInfo {
  client_token: string;
  accessor: string;
  policies: string[];
  lease_duration: number;
  renewable: boolean;
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

export interface HTMLError extends Error {
  html(): JSX.Element;
}

export class APIError extends Error implements HTMLError {
  constructor(
    private statusText: string,
    private status: number,
    private errors: string[]
  ) {
    super(`${statusText} (${status}):\n${errors.join("\n")}`);
  }

  html(): JSX.Element {
    return (
      <p class="mb-0">
        <strong>
          {this.statusText} ({this.status})
        </strong>
        {this.errors.map((e) => (
          <pre class="mb-0 mt-1">{e.trimEnd()}</pre>
        ))}
      </p>
    );
  }
}

// removes leading and trailing slashes
export const trimPath = (path: string): string =>
  path.replace(/^\/+|\/+$/g, "");

export interface Mounts {
  kv: string;
  oidc: string;
}

export interface ClientAuthData {
  token: string;
  expiresAt?: Date;
}

type Duration = number;

// DateTime helpers
const Millisecond: Duration = 1;
const Second = (1000 * Millisecond) as Duration;
const Minute = (60 * Second) as Duration;
const add = (point: Date, distance: Duration): Date => {
  return new Date(point.valueOf() + distance);
};

export interface OauthFlowParams {
  state: string;
  code: string;
}

export class VaultClient {
  private baseUrl: string;
  private mounts: Mounts;
  private authData?: ClientAuthData;
  private renewTimeout?: NodeJS.Timeout;

  constructor(baseUrl: string, mounts: Mounts, auth?: ClientAuthData | string) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // trim trailing slash
    this.mounts = Object.entries(mounts).reduce((acc, [k, v]) => {
      acc[k] = trimPath(v);
      return acc;
    }, {} as Mounts);

    if (typeof auth === "string") {
      this.authData = { token: auth };
    } else {
      this.authData = auth;
      this.renewIfNeeded(); // takes care of scheduling a timer for renewal
    }
  }

  cancel() {
    if (this.renewTimeout) {
      clearTimeout(this.renewTimeout);
    }
  }

  private async clientAuthFromInfo(info: AuthInfo): Promise<ClientAuthData> {
    const { client_token: token, renewable } = info;
    if (!renewable) {
      return { token };
    }

    const { expire_time } = await this.tokenLookup(token);
    const expiresAt = new Date(expire_time);
    return { token, expiresAt };
  }

  private async renewIfNeeded(): Promise<void> {
    // noop if we can't renew
    if (!this.authData?.expiresAt) {
      return;
    }

    if (this.renewTimeout) {
      // clear auto-renewal timeout
      clearTimeout(this.renewTimeout);
    }

    // renew if expires in less than 5 minutes
    if (this.authData.expiresAt < add(new Date(), 5 * Minute)) {
      const info = await this.tokenRenewSelf();
      this.authData = await this.clientAuthFromInfo(info);
    }

    // schedule an auto-renew timer
    if (this.authData.expiresAt) {
      const expiresInMs = this.authData.expiresAt.valueOf() - Date.now();
      const renewTimeout = expiresInMs - 1 * Minute; // auto-renew 1 minute before expiry
      if (renewTimeout > 0) {
        this.renewTimeout = setTimeout(
          () => this.renewIfNeeded(),
          renewTimeout
        );
      }
    }
  }

  private async requestWithRenew<R, B = null>(
    path: string,
    method?: HTTPMethod,
    body?: B
  ): Promise<R> {
    await this.renewIfNeeded();
    return this.request(path, method, body);
  }

  private async request<R, B = null>(
    path: string,
    method?: HTTPMethod,
    body?: B
  ): Promise<R> {
    const headers = {};
    if (this.authData?.token) {
      headers["X-Vault-Token"] = this.authData?.token;
    }

    const init: RequestInit = {
      method: method || "GET",
      headers,
    };
    if (body) {
      init.body = JSON.stringify(body);
    }

    const resp = await fetch(`${this.baseUrl}/${path}`, init);
    if (!resp.ok) {
      if (resp.status === 404) {
        throw new NotFoundError();
      }

      let errors = [];
      try {
        const info: { errors: string[] } = await resp.json();
        errors = info.errors;
      } catch (e) {}
      throw new APIError(resp.statusText, resp.status, errors);
    }

    if (resp.status === 200) {
      return resp.json();
    }
  }

  async tokenLookup(token: string): Promise<TokenLookupSelf> {
    const tempClient = new VaultClient(this.baseUrl, this.mounts, { token });
    return tempClient.tokenLookupSelf();
  }

  async tokenLookupSelf(): Promise<TokenLookupSelf> {
    const info: WrappedData<TokenLookupSelf> = await this.request(
      "v1/auth/token/lookup-self"
    );
    return info.data;
  }

  async tokenRenewSelf(): Promise<AuthInfo> {
    const info: { auth: AuthInfo } = await this.request(
      "v1/auth/token/renew-self",
      "POST"
    );
    return info.auth;
  }

  async oidcAuthURL(redirect_uri: string, role?: string): Promise<AuthUrl> {
    const info: WrappedData<AuthUrl> = await this.request(
      `v1/${this.mounts.oidc}/oidc/auth_url`,
      "POST",
      {
        role,
        redirect_uri,
      }
    );
    return info.data;
  }

  async oidcCallback(params: OauthFlowParams): Promise<AuthInfo> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, v));
    const info: { auth: AuthInfo } = await this.request(
      `v1/${this.mounts.oidc}/oidc/callback?${qs.toString()}`
    );
    return info.auth;
  }

  async oidcCompleteFlow(params: {
    state: string;
    code: string;
  }): Promise<VaultClient> {
    const info = await this.oidcCallback(params);
    const auth = await this.clientAuthFromInfo(info);
    return new VaultClient(this.baseUrl, this.mounts, auth);
  }

  async listSecrets(path: string): Promise<ListSecrets> {
    path = trimPath(path);
    const reqPath = `v1/${this.mounts.kv}/metadata/${path}/?list=true`;
    const secrets: WrappedData<ListSecrets> = await this.requestWithRenew(
      reqPath
    );
    return secrets.data;
  }

  async secretMetadata(path: string): Promise<SecretMetadata> {
    const meta: WrappedData<SecretMetadata> = await this.requestWithRenew(
      `v1/${this.mounts.kv}/metadata/${trimPath(path)}`
    );
    return meta.data;
  }

  async secretData(path: string): Promise<SecretData> {
    const reqPath = `v1/${this.mounts.kv}/data/${trimPath(path)}`;
    const data: WrappedData<SecretData> = await this.requestWithRenew(reqPath);
    return data.data;
  }

  async secretMetadataUpdate(
    path: string,
    meta: Record<string, string>
  ): Promise<void> {
    const metaReqPath = `v1/${this.mounts.kv}/metadata/${trimPath(path)}`;
    await this.requestWithRenew<{}, SecretMetadataCreation>(
      metaReqPath,
      "POST",
      { custom_metadata: meta }
    );
  }

  async secretDataUpdate(
    path: string,
    data: Record<string, string>,
    version?: number
  ): Promise<SecretCreationResponse> {
    const dataReqPath = `v1/${this.mounts.kv}/data/${trimPath(path)}`;
    const creation = await this.requestWithRenew<
      WrappedData<SecretCreationResponse>,
      SecretDataCreation
    >(dataReqPath, "POST", {
      options: { cas: version },
      data,
    });
    return creation.data;
  }

  async secretDelete(path: string): Promise<void> {
    const reqPath = `v1/${this.mounts.kv}/metadata/${trimPath(path)}`;
    await this.requestWithRenew(reqPath, "DELETE");
  }
}

export const displayError = (e: Error): JSX.Element => {
  if (typeof (e as HTMLError).html === "function") {
    return (e as HTMLError).html();
  }

  return <>{e.message || e.toString()}</>;
};
