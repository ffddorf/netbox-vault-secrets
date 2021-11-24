from extras.plugins import PluginTemplateExtension


class VaultDeviceSecrets(PluginTemplateExtension):
    model = 'dcim.device'

    def right_page(self):
        script_data = {
            "object_id": self.context["object"].id,
        }
        return self.render('netbox_vault_secrets/secrets.html', extra_context={
            "script_data": script_data
        })


template_extensions = [VaultDeviceSecrets]
