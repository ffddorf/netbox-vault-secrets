#!/bin/bash

source /opt/netbox/venv/bin/activate

pip install -e /src

SECRET_KEY="dummy" python /opt/netbox/netbox/manage.py collectstatic --no-input

exec /opt/netbox/docker-entrypoint.sh "$@"
