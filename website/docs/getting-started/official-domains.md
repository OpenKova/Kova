---
title: Official Domains & Phishing Safety
description: How to verify you are using genuine Kova Agent resources, and how to spot impersonation scams.
---

# Official Domains & Phishing Safety

Kova Agent's popularity has attracted impersonation campaigns: fake "Kova" websites, GitHub accounts that mass-mention contributors with shortlinks, and cold emails offering "credits" on lookalike products. This page lists the official sources so you can check anything that claims to be Kova Agent.

## Official sources

OpenKova operates `nousresearch.com` and its subdomains. The ones Kova Agent uses:

| Address | What it is |
|---|---|
| [github.com/OpenKova/Kova](https://github.com/OpenKova/Kova/) | Documentation, Desktop downloads, and the `install.sh` / `install.ps1` installers |
| `hermes-assets.nousresearch.com` | Release artifacts: Desktop packages and updates, the Termux APT repository, installer mirrors |
| [portal.nousresearch.com](https://portal.nousresearch.com/) | Nous Portal: account sign-in, subscriptions, billing |
| `inference-api.nousresearch.com` | The Nous inference API Kova calls when you use the Nous provider (no web page) |
| [nousresearch.com](https://nousresearch.com/) | OpenKova website |

Outside `nousresearch.com`:

- **GitHub:** the [OpenKova organization](https://github.com/OpenKova) and its [kova-agent repository](https://github.com/OpenKova/Kova) (source, releases, the Nix flake). Raw files from that repository are served from `raw.githubusercontent.com/OpenKova/Kova/...`; that is the same repository, not a separate source. Any other account or repository is not ours.
- **Docker Hub:** the [`openkova/kova`](https://hub.docker.com/r/openkova/kova) image, published by the repository's release workflow (see [Docker](../user-guide/docker.md)). Only the `nousresearch` namespace is official; images under other names or registries are not.
- **X (Twitter):** [@OpenKova](https://x.com/OpenKova)
- **Discord:** [discord.gg/OpenKova](https://discord.gg/OpenKova)

## Installing from an official source

The script installers are served from `github.com/OpenKova/Kova`:

```bash
# Linux / macOS / WSL2
curl -fsSL https://github.com/OpenKova/Kova/install.sh | bash
```

```powershell
# Windows (native)
iex (irm https://github.com/OpenKova/Kova/install.ps1)
```

The other supported routes also stay on official sources: Desktop packages download from the [Kova website](https://github.com/OpenKova/Kova/), Termux uses the signed APT repository on `hermes-assets.nousresearch.com` (see the [Termux guide](./termux.md), not the script above), Nix builds from the GitHub repository (see [Nix & NixOS](./nix-setup.md)), and Docker pulls `openkova/kova` from Docker Hub. Some guides fetch `install.ps1` straight from the repository at `raw.githubusercontent.com/OpenKova/Kova/main/scripts/install.ps1`; it is the same script.

If an installer, download, image, or "portal" is hosted anywhere other than the sources listed on this page, treat it as untrusted.

## Not official

- **Any domain that is not `nousresearch.com` or one of its subdomains** (apart from the accounts listed above), even when it contains "kova" or "kova-agent" (`.icu`, `.org`, `.ai` and other variants), copies the branding, or says it "points to official docs". Read the whole host name: `github.com/OpenKova/Kova.example.net` is not a OpenKova subdomain.
- **Cryptocurrency tokens.** There is **no Kova Agent or OpenKova token**. Any account or site promoting one is a scam.
- **GitHub accounts that mass-mention users** in discussions or issues with "community notice" posts and URL-shortener links (`goo.su`, `bit.ly`, etc.). Genuine project announcements never arrive as mass @-mentions with shortlinks.
- **Unsolicited emails** offering credits, hosted "multiplayer Kova" products, or partnership deals that name-drop the project to build trust.

## If you receive a suspicious message

1. **Don't click** shortened or off-domain links; don't enter credentials or connect wallets.
2. **Report the account** to GitHub (`Report abuse` on the profile) or the relevant platform.
3. **Check the host name** against the rule above: if it is not `nousresearch.com` or a subdomain of it, and not one of the accounts listed here, it isn't ours.
4. Optionally flag it in the [OpenKova Discord](https://discord.gg/OpenKova) or an issue so others see it, but note that impersonation campaigns are external abuse: they're handled by platform reports, not code changes.

Kova Agent is MIT-licensed and free to self-host. Nobody legitimate will ever ask you to pay for the open-source agent itself, claim "your account has credits waiting", or DM you an alternate download link.
