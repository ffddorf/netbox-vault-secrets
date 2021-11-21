from extras.plugins import PluginConfig


class VaultSecretsConfig(PluginConfig):
    name = 'netbox_vault_secrets'
    verbose_name = 'Vault Secrets'
    description = 'Integrates Netbox with Vault for managing secrets'
    version = '0.1'
    author = 'Marcus Weiner'
    author_email = 'mraerino@freifunk-duesseldorf.de'
    base_url = 'vault-secrets'
    required_settings = []
    default_settings = {

    }


config = VaultSecretsConfig
