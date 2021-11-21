from extras.plugins import PluginTemplateExtension


class VaultDeviceSecrets(PluginTemplateExtension):
    model = 'dcim.device'

    def right_page(self):
        return self.render('netbox_vault_secrets/secrets.html', extra_context={})


template_extensions = [VaultDeviceSecrets]
