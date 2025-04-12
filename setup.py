from setuptools import find_packages, setup

setup(
    name="netbox_vault_secrets",
    version="0.0.2",
    description="NetBox Plugin to manage vault secrets from Netbox",
    url="https://github.com/ffddorf/netbox-vault-secrets",
    author="Marcus Weiner",
    author_email="mraerino@freifunk-duesseldorf.de",
    license="BSD 2-clause",
    license_files=("LICENSE.md",),
    python_requires=">=3.10",
    install_requires=[],
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)
