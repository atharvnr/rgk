# Moving the droplet to SFO3 with more memory

DigitalOcean cannot resize a droplet into a size that its region does not offer, and
cannot move a droplet between regions. The path is: new droplet in SFO3, bootstrap it
from this repo, copy the Mongo data, repoint DNS, destroy the old one.

Target: `s-1vcpu-2gb` ($12/mo) in `sfo3`. The stack (API + Mongo + Redis + nginx) idles
around 600 MB; 1 GB works only with swap doing real work, 2 GB leaves headroom.

## 1. Create the droplet (rgk team)

```bash
doctl auth init --context rgk          # token from the rgk team, API > Tokens
doctl auth switch --context rgk
doctl compute ssh-key list             # note the ID of the key you ssh with
doctl compute droplet create rgk-sfo3 \
  --region sfo3 --size s-1vcpu-2gb --image ubuntu-24-04-x64 \
  --ssh-keys <KEY_ID> --tag-name rgk --wait \
  --format ID,Name,PublicIPv4
```

The key registered in GitHub as `DROPLET_SSH_KEY` must be among `--ssh-keys`, or
the deploy workflows cannot log in.

## 2. Point GitHub at it

```bash
gh variable set DROPLET_IP --body <NEW_IP>
```

## 3. Bootstrap

Run the **Droplet Bootstrap** workflow (Actions tab, or `gh workflow run droplet-bootstrap.yml`).
It installs swap, Docker, nginx, the Cloudflare origin cert, writes `infra/.env`
and starts `infra/docker-compose.yml` (Mongo, Redis, API, Watchtower).

Then run **Frontend Deploy** (`gh workflow run frontend-deploy.yml`) to publish the
web build to `/var/www/rgk`.

## 4. Copy the database

```bash
infra/migrate-mongo.sh <OLD_IP> <NEW_IP>
```

This starts `mongod` on the old droplet if it is down, dumps `rgk`, and restores it
into the `rgk-mongo` container on the new droplet. It prints collection counts at the end.

## 5. DNS (Cloudflare)

Edit the A records for `rentgrandkids.org`, `www` and `api` to the new IP, proxied.
Keep SSL/TLS mode **Full (strict)**; the origin cert from `CF_ORIGIN_CERT` is installed
by the bootstrap.

Check:

```bash
curl -s https://api.rentgrandkids.org/api/v1/health/ready
curl -sI https://rentgrandkids.org | head -1
```

Expect `{"status":"ready",...}` and `HTTP/2 200`.

## 6. Retire the old droplet

After a day of clean logs: snapshot it (Backups & Snapshots), then destroy it.

## Day-2

- Backend changes deploy through GHCR + Watchtower within 5 minutes of a push.
- Mongo is dumped nightly to `/root/backups` (7 days kept).
- `docker compose -f /root/rgk/infra/docker-compose.yml ps` shows health of every service.
- `docker logs --tail 100 rgk-api` for API logs.
