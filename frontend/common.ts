import { SecretMetadata } from "./client";

export interface SecretInfo {
  id: string;
  label: string;
  username: string;
  version: number;
}

export const infoFromMeta = (id: string, meta: SecretMetadata): SecretInfo => ({
  id: id,
  label: meta.custom_metadata.label || id,
  username: meta.custom_metadata.username || "",
  version: meta.current_version,
});

export interface EditOp {
  id: string;
  done: (id: string) => void;
}
