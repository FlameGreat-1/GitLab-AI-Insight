#!/bin/bash

az login

az container create \
    --resource-group myResourceGroup \
    --name gitlab-insight-ai \
    --image myacr.azurecr.io/gitlab-insight-ai:latest \
    --dns-name-label gitlab-insight-ai \
    --ports 80
