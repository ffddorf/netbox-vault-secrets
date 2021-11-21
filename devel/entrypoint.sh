#!/bin/bash

source /opt/netbox/venv/bin/activate

bash -c "cd /src && python setup.py develop --user"

exec /opt/netbox/docker-entrypoint.sh "$@"
