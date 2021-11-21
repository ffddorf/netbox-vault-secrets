from setuptools import find_packages, setup

setup(
    name='netbox_vault_secrets',
    version='0.1',
    description='NetBox Plugin to manage vault secrets from Netbox',
    url='https://github.com/ffddorf/netbox-vault-secrets',
    author='Marcus Weiner',
    license='BSD 3-clause',
    install_requires=[],
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)
