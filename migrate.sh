#!/bin/bash
set -a
source .env
set +a
npx prisma migrate dev --name add-victim-model
