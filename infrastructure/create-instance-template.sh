gcloud compute instance-templates create-with-container phillip-instance-template \
  --machine-type f1-micro \
  --boot-disk-size 10GB \
  --container-image gcr.io/discord-phillip/phillip:latest \
  --tags http-server,https-server
