import pkg_resources
from extras.plugins import PluginConfig

pkg_info = pkg_resources.require("netbox_vault_secrets")[0]


class VaultSecretsConfig(PluginConfig):
    name = pkg_info.name
    verbose_name = 'Vault Secrets'
    description = pkg_info.description
    version = pkg_info.version
    author = pkg_info.author
    author_email = pkg_info.author_email

    min_version = '3.0.0'
    required_settings = ['api_url']
    default_settings = {
        "kv_mount_path": "/v1/secret",
        "secret_path_prefix": "/netbox",
    }


config = VaultSecretsConfig
