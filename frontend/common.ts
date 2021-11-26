import { SecretMetadata } from "./client";

export interface SecretInfo {
  id: string;
  label: string;
  username: string;
}

export const infoFromMeta = (id: string, meta: SecretMetadata) => ({
  id: id,
  label: meta.custom_metadata.label || id,
  username: meta.custom_metadata.username || "",
});
