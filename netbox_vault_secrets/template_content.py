import os

from extras.plugins import PluginTemplateExtension


class VaultSecretInserter(PluginTemplateExtension):
    def right_page(self):
        script_data = {
            "objectPath": f"{self.vault_path_slug}/{self.context['object'].id}",
            "config": self.context['config'],
        }
        return self.render('netbox_vault_secrets/secrets.html', extra_context={
            "script_data": script_data,
            "is_development_env": 'NETBOX_VAULT_DEVELOP' in os.environ
        })


class VaultDeviceSecrets(VaultSecretInserter):
    vault_path_slug = "device"
    model = 'dcim.device'


class VaultServiceSecrets(VaultSecretInserter):
    vault_path_slug = "service"
    model = 'ipam.service'


class VaultVMSecrets(VaultSecretInserter):
    vault_path_slug = "vm"
    model = 'virtualization.virtualmachine'


class VaultTenantSecrets(VaultSecretInserter):
    vault_path_slug = "tenant"
    model = "tenancy.tenant"

class VaultSiteSecrets(VaultSecretInserter):
    vault_path_slug = "site"
    model = "dcim.site"

template_extensions = [VaultDeviceSecrets, VaultServiceSecrets, VaultVMSecrets,VaultTenantSecrets,VaultSiteSecrets]

