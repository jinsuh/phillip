#!/bin/bash
# Specify the BOT_TOKEN and STOCK_API as positional arguments
gcloud compute instance-templates create-with-container phillip-instance-template \
  --machine-type f1-micro \
  --boot-disk-size 10GB \
  --container-image gcr.io/discord-phillip/phillip:latest \
  --container-env BOT_TOKEN=$2 \
  --container-env STOCK_API=$3 \
  --tags http-server,https-server
