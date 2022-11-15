import logging
import os

from django.conf import settings

from extras.plugins import PluginTemplateExtension


logger = logging.getLogger('netbox_vault_secrets')


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


def create_secret_inserter(vault_path_slug=None, model=None):
    name_components = model.split('.')
    if vault_path_slug is None:
        vault_path_slug = name_components[1]
        logger.debug("Inferred slug '%s' for model %s" % (vault_path_slug, model))
    else:
        logger.debug("Using overridden slug '%s' for model %s" % (vault_path_slug, model))

    type_name = "Vault%s%sSecrets" % (name_components[0].capitalize(), name_components[1].capitalize())
    logger.debug("Creating VaultSecretInserter sub-class %s" % type_name)
    return type(
        type_name,
        (VaultSecretInserter, ),
        {
            "vault_path_slug": vault_path_slug,
            "model": model
        }
    )


allowed_apps = [
    'circuits',
    'dcim',
    'extras',
    'ipam',
    'tenancy',
    'virtualization',
    'wireless'
]
logger.debug("Allowed apps: %s" % ", ".join(allowed_apps))

content_types = settings.PLUGINS_CONFIG['netbox_vault_secrets']['content_types']
logger.debug("Configured content_types: %s" % ", ".join([ct['model'] for ct in content_types]))

ignored_content_types = [ct['model'] for ct in content_types if ct['model'].split('.')[0] not in allowed_apps]
if len(ignored_content_types) > 0:
    logger.info("ignored dis-allowed content_types: %s" % ", ".join(ignored_content_types))

template_extensions = [
    create_secret_inserter(**ct) for ct in content_types if ct['model'].split('.')[0] in allowed_apps
]
