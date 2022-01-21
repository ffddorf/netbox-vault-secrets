from importlib.metadata import metadata
from extras.plugins import PluginConfig

meta = metadata('netbox_vault_secrets')


class VaultSecretsConfig(PluginConfig):
    name = 'netbox_vault_secrets'
    verbose_name = 'Vault Secrets'
    description = meta['description']
    version = meta['version']
    author = meta['author']
    author_email = meta['author-email']

    min_version = '3.0.0'
    required_settings = ['api_url']
    default_settings = {
        "kv_mount_path": "/v1/secret",
        "secret_path_prefix": "/netbox",
    }


config = VaultSecretsConfig
