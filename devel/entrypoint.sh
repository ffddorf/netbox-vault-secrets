#!/bin/bash

source /opt/netbox/venv/bin/activate

bash -c "cd /src && python setup.py develop --user"

SECRET_KEY="dummy" python /opt/netbox/netbox/manage.py collectstatic --no-input

exec /opt/netbox/docker-entrypoint.sh "$@"
