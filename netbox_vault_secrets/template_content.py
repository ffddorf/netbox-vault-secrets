from extras.plugins import PluginTemplateExtension


class VaultSecretInserter(PluginTemplateExtension):
    def right_page(self):
        script_data = {
            "objectPath": f"netbox/{self.vault_path_slug}/{self.context['object'].id}",
        }
        return self.render('netbox_vault_secrets/secrets.html', extra_context={
            "script_data": script_data
        })


class VaultDeviceSecrets(VaultSecretInserter):
    vault_path_slug = "device"
    model = 'dcim.device'


template_extensions = [VaultDeviceSecrets]
