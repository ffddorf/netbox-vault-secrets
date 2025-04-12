from importlib.metadata import metadata

from netbox.plugins import PluginConfig

meta = metadata("netbox_vault_secrets")


class VaultSecretsConfig(PluginConfig):
    name = "netbox_vault_secrets"
    verbose_name = "Vault Secrets"
    description = meta["description"]
    version = meta["version"]
    author = meta["author"]
    author_email = meta["author-email"]
    base_url = "vault"

    min_version = "4.0.0"
    required_settings = ["api_url"]
    default_settings = {
        "kv_mount_path": "/secret",
        "secret_path_prefix": "/netbox",
    }

    def ready(self):
        from django.conf import settings

        # todo: ugly hack, try to get it working with django defaults
        settings.SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"
        super().ready()


config = VaultSecretsConfig
