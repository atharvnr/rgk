#!/usr/bin/env bash
# Copy the rgk MongoDB database from the old droplet to the new one.
# Run from your laptop:  infra/migrate-mongo.sh <old-ip> <new-ip> [ssh-key]
#
# Old droplet: MongoDB installed from apt (mongod.service), database "rgk".
# New droplet: MongoDB runs in the rgk-mongo container (infra/docker-compose.yml).
set -euo pipefail

OLD="${1:?old droplet ip}"
NEW="${2:?new droplet ip}"
KEY="${3:-$HOME/.ssh/digitalocean-anand}"
SSH="ssh -o StrictHostKeyChecking=accept-new -i ${KEY}"
STAMP="$(date +%Y%m%d%H%M%S)"
DUMP="rgk-${STAMP}.archive.gz"

echo "==> Dumping rgk from ${OLD}"
$SSH "root@${OLD}" "systemctl is-active --quiet mongod || systemctl start mongod; sleep 3; mongodump --db rgk --archive --gzip" > "/tmp/${DUMP}"
ls -lh "/tmp/${DUMP}"

echo "==> Restoring into rgk-mongo on ${NEW}"
scp -o StrictHostKeyChecking=accept-new -i "${KEY}" "/tmp/${DUMP}" "root@${NEW}:/root/${DUMP}"
$SSH "root@${NEW}" "docker exec -i rgk-mongo mongorestore --drop --archive --gzip < /root/${DUMP} && rm /root/${DUMP}"

echo "==> Collections on ${NEW}"
$SSH "root@${NEW}" "docker exec rgk-mongo mongosh --quiet rgk --eval 'db.getCollectionNames().forEach(c => print(c, db[c].countDocuments()))'"

echo "Local copy kept at /tmp/${DUMP}"
