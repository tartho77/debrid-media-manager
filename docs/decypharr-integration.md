# DMM → Decypharr integration

This fork adds a **Decypharr** button beside the existing Copy/Download and Report actions on movie and TV search results.

## Behaviour

1. Click **Decypharr** on a torrent result.
2. Choose **Radarr** or **Sonarr**.
3. DMM sends the magnet to Decypharr's qBittorrent-compatible endpoint:
   - `POST /api/v2/torrents/add`
   - `urls=magnet:?xt=urn:btih:...`
   - `category=radarr` or `category=sonarr`

For movie results, Radarr is suggested first. For TV results, Sonarr is suggested first.

The Decypharr API token is never sent to the browser. The browser calls DMM's server-side `/api/decypharr/add` endpoint, which then contacts Decypharr.

## Required DMM environment variables

```env
DECYPHARR_URL=http://192.168.1.50:8282
DECYPHARR_TOKEN=your-decypharr-api-token
```

`DECYPHARR_URL` must be reachable **from the DMM container**. If DMM and Decypharr are in separate Portainer stacks, using the NAS LAN IP and Decypharr's published port is the simplest option.

`DECYPHARR_TOKEN` is optional if Decypharr authentication is disabled, but it is recommended when authentication is enabled.

## Synology / Portainer

An example stack is available at:

`deploy/docker-compose.synology.example.yml`

Before deploying it in Portainer, define these stack environment variables:

- `DMM_DB_PASSWORD` — use a URL-safe password (letters/numbers is simplest)
- `DMM_DB_ROOT_PASSWORD`
- `DMM_ORIGIN` — for example `http://192.168.1.20:3000`
- `DMMCAST_SALT` — a long random value
- `DECYPHARR_URL` — for example `http://192.168.1.20:8282`
- `DECYPHARR_TOKEN` — Decypharr Settings → Auth token

The stack creates MariaDB, Redis, performs Prisma migrations, and starts the custom DMM image.

## Custom Docker image

GitHub Actions builds:

`ghcr.io/tartho77/dmm-decypharr:latest`

A pull request build validates the Docker image without publishing it. A push to `main` builds and publishes the image.

## Upstream DMM updates

`.github/workflows/sync-upstream.yml` checks the official repository every day and merges `debridmediamanager/debrid-media-manager:main` into this fork's `main` branch.

If Git can merge the update automatically, the custom image is rebuilt. If there is a merge conflict, the workflow stops instead of overwriting the Decypharr integration.

## Radarr/Sonarr ownership note

The current integration sends the torrent directly to Decypharr with the selected `radarr` or `sonarr` category. This is sufficient to add it to Decypharr under that category.

It does **not** impersonate a logged-in Radarr/Sonarr qBittorrent client session. If full Arr queue ownership/import tracking is required later, the integration can be extended to authenticate to Decypharr using the selected Arr instance credentials before submitting the magnet.
