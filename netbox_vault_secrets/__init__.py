from extras.plugins import PluginConfig


class VaultSecretsConfig(PluginConfig):
    name = 'netbox_vault_secrets'
    verbose_name = 'Vault Secrets'
    description = 'Integrates Netbox with Vault for managing secrets'
    version = '0.1'
    author = 'Marcus Weiner'
    author_email = 'mraerino@freifunk-duesseldorf.de'
    required_settings = ['api_url']
    default_settings = {
        "kv_mount_path": "/v1/secret",
        "secret_path_prefix": "/netbox",
    }


config = VaultSecretsConfig
