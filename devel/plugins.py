PLUGINS = ["netbox_vault_secrets"]

PLUGINS_CONFIG = {
    "netbox_vault_secrets": {
        "api_url": "http://localhost:8082/",
        "kv_mount_path": "/secret",
        "secret_path_prefix": "/netbox",
        "login_methods": ["token", "oidc"],
        "oidc": {
            "roles": {
                "demo": "Google",
            },
        },
    }
}
