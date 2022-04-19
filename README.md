# Hashicorp Vault Plugin for Netbox

Provides convenient access to secrets stored in [Hashicorp Vault](https://www.vaultproject.io/) via the Netbox UI. You can attach secrets on a _Device_, _Virtual Machine_ or _Service_. The plugin is intended to serve as a possible replacement for the secrets functionality present in Netbox pre 3.0. The Netbox maintainers recommend replacing it with Vault.

It will add a card like this:

<img width="405" alt="Screenshot 2021-12-05 at 22 38 29" src="https://user-images.githubusercontent.com/4941459/144764882-e735c08d-468a-40a3-822a-81e2b882ccba.png">

The functionality is entirely client side. The plugin uses Javascript in the browser to access the Vault API directly. Your Netbox installation will never have access to the secrets or authentication credentials in Vault.

Secrets are stored at paths per a simple convention:
- `/device/{id}/{slug}` for Devices
- `/vm/{id}/{slug}` for Virtual Machines
- `/service/{id}/{slug}` for Services

## Installation

This plugin is not yet available as a PyPi package. Please see the [Releases](https://github.com/ffddorf/netbox-vault-secrets/releases) for downloads.

Please note that this plugin needs a run of  `python manage.py collectstatic` to work after being configured. For the official Docker image see the [official instructions](https://github.com/netbox-community/netbox-docker/wiki/Using-Netbox-Plugins#custom-docker-file).

## Setup

After installing the package, add the plugin to the Netbox configuration.

```py
PLUGINS = ["netbox_vault_secrets"]

PLUGINS_CONFIG = {
    "netbox_vault_secrets": {
        "api_url": "https://your-vault-deployment/", # can be relative
        "kv_mount_path": "/secret",  # optional
        "secret_path_prefix": "/netbox",  # optional
        "login_methods": ["token", "oidc"], # optional, defaults to ["token"]
        "oidc": {
            "mount_path": "/auth/oidc", # optional
            "roles": { # optional, will use `default_role` if missing
                "demo": "Demo Provider", # maps role name to display name
            }
        },
    }
}
```

### Vault CORS settings

Note that if your Vault installation runs at a different _origin_ than Netbox, you need to [enable CORS](https://www.vaultproject.io/api/system/config-cors).

You can use this command (requires `sudo` privileges):

```sh
vault write /sys/config/cors enabled=true allowed_origins="*"
```

You can also set only the hostname of your Netbox deployment as an allowed origin.

Alternatively, proxy the Vault API on a subpath in your Netbox deployment, thereby moving it to the same origin, so no CORS setup is required.

### Vault OIDC Role Setup

The minimal settings required on the role used for OIDC with the plugin are:

```sh
vault write auth/oidc/role/<role name> allowed_redirect_uris="https://<your netbox>/plugins/vault/callback" ttl=1h
```

You should attach a policy similar to this to users who are going to use it:

```hcl
path "secret/metadata/netbox/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/data/netbox/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
}
```

## License

This code is licensed under the [2-clause BSD license](LICENSE.md).
