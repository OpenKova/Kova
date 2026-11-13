"""Private read-only console for aggregate telemetry and user-approved support bundles."""

from __future__ import annotations

import base64
import hmac
import json
import os
import re
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, Response

router = APIRouter()


def authorize(request: Request) -> None:
    expected = os.environ.get("ADMIN_DASHBOARD_PASSWORD", "").strip()
    if not expected:
        raise HTTPException(404, "Not found.")
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("basic "):
        raise HTTPException(
            401,
            "Sign in required.",
            headers={"WWW-Authenticate": "Basic realm=Kova Admin"},
        )
    try:
        username, password = (
            base64.b64decode(header[6:], validate=True).decode().split(":", 1)
        )
    except (ValueError, UnicodeDecodeError):
        username, password = "", ""
    if not hmac.compare_digest(username, "admin") or not hmac.compare_digest(
        password, expected
    ):
        raise HTTPException(
            401,
            "Sign in required.",
            headers={"WWW-Authenticate": "Basic realm=Kova Admin"},
        )


PAGE = r"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Kova telemetry</title><style>
:root{font:14px/1.5 Inter,system-ui,sans-serif;color:#e9edf4;background:#090b10}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 75% -15%,#192339,transparent 42%),#090b10}main{max-width:1180px;margin:auto;padding:42px 28px 72px}.top{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:28px}.eyebrow{color:#8290a8;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:700}.title{font-size:30px;letter-spacing:-.04em;margin:5px 0 0}.sub{color:#919baa;margin:5px 0 0}select,button{font:inherit;color:inherit;background:#171b24;border:1px solid #292f3b;border-radius:9px;padding:9px 12px}button{cursor:pointer}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:linear-gradient(145deg,#131720,#10131a);border:1px solid #222834;border-radius:14px;box-shadow:0 10px 36px #0002}.card{padding:17px 18px}.label{color:#929bad;font-size:12px}.value{font-size:28px;font-weight:650;letter-spacing:-.04em;margin-top:6px}.hint{color:#727d90;font-size:11px}.row{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;margin-bottom:14px}.panel{padding:20px;margin-bottom:14px}.panel h2{font-size:15px;margin:0 0 16px}.bars{display:flex;align-items:end;gap:6px;height:145px;padding-top:8px;border-bottom:1px solid #282e39}.bar{flex:1;min-width:4px;border-radius:5px 5px 1px 1px;background:linear-gradient(#a9baff,#647df5);position:relative}.bar:hover:after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap;background:#252c39;padding:3px 6px;border-radius:5px}.axis{display:flex;justify-content:space-between;color:#687286;font-size:10px;padding-top:7px}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}.list{display:grid;gap:11px}.item{display:flex;justify-content:space-between;gap:12px}.muted,.notice{color:#818b9e}.track{height:4px;background:#242a35;border-radius:3px;margin-top:5px;overflow:hidden}.track i{display:block;height:100%;background:#8297ff}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:#828da0;font-weight:500;padding:0 12px 10px}td{padding:12px;border-top:1px solid #252b36}a{color:#b7c3ff;text-decoration:none}.empty{text-align:center;padding:26px;color:#8993a5}.notice,.status{font-size:11px}.status{color:#9ca8bb}@media(max-width:780px){main{padding:26px 16px}.grid{grid-template-columns:repeat(2,1fr)}.row{grid-template-columns:1fr}.title{font-size:25px}}
</style></head><body><main><div class="top"><div><div class="eyebrow">Kova · private operations</div><h1 class="title">Telemetry & support</h1><p class="sub">Opt-in product signals and user-submitted diagnostics.</p></div><div><select id="days"><option value="7">7 days</option><option value="30" selected>30 days</option><option value="90">90 days</option></select> <button id="reload">Refresh</button></div></div><section class="grid" id="cards"></section><div class="row"><section class="panel"><h2>Incoming metrics packages</h2><div id="chart"></div></section><section class="panel"><h2>Install base</h2><div class="split"><div><div class="label">Operating systems</div><div class="list" id="systems"></div></div><div><div class="label">Versions</div><div class="list" id="versions"></div></div></div><p class="notice">No email, prompts, files, or paths appear here.</p></section></div><section class="panel"><h2>Top product signals</h2><table><thead><tr><th>Signal</th><th>Total</th><th>Packages</th><th>Last received</th></tr></thead><tbody id="signals"></tbody></table></section><section class="panel"><h2>Support bundles <span class="muted" id="bundleCount"></span></h2><table><thead><tr><th>Received</th><th>Expires</th><th>Size</th><th></th></tr></thead><tbody id="bundles"></tbody></table><p class="notice">User-approved bundles are sensitive. Downloads expire automatically.</p></section><p class="status" id="status"></p></main><script>
const fmt=n=>new Intl.NumberFormat().format(n),when=s=>new Date(s*1000).toLocaleString(),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function lists(el,data){let max=Math.max(1,...data.map(x=>x.count));el.innerHTML=data.length?data.map(x=>`<div><div class="item"><span>${esc(x.name)}</span><span>${fmt(x.count)}</span></div><div class="track"><i style="width:${Math.max(2,x.count/max*100)}%"></i></div></div>`).join(''):'<span class="muted">No data yet</span>'}async function load(){let days=document.querySelector('#days').value;document.querySelector('#status').textContent='Refreshing…';let r=await fetch(`/admin/data?days=${days}`,{cache:'no-store'});if(!r.ok){document.querySelector('#status').textContent=`Could not load dashboard (${r.status}).`;return}let d=await r.json();document.querySelector('#cards').innerHTML=[['Unique installs',fmt(d.summary.installs),'Opted-in reporting profiles'],['Packages',fmt(d.summary.packages),`${days}-day window`],['Signals counted',fmt(d.summary.signal_total),'Aggregate counter values'],['Support bundles',fmt(d.summary.bundle_count),'Currently retained']].map(([a,b,c])=>`<article class="card"><div class="label">${a}</div><div class="value">${b}</div><div class="hint">${c}</div></article>`).join('');let max=Math.max(1,...d.daily.map(x=>x.count));document.querySelector('#chart').innerHTML=`<div class="bars">${d.daily.map(x=>`<div class="bar" style="height:${Math.max(2,x.count/max*100)}%" data-tip="${esc(x.day)} · ${fmt(x.count)}"></div>`).join('')}</div><div class="axis"><span>${esc(d.daily[0]?.day||'')}</span><span>${esc(d.daily.at(-1)?.day||'')}</span></div>`;lists(document.querySelector('#systems'),d.systems);lists(document.querySelector('#versions'),d.versions);document.querySelector('#signals').innerHTML=d.signals.length?d.signals.map(x=>`<tr><td>${esc(x.name)}</td><td>${fmt(x.total)}</td><td>${fmt(x.packages)}</td><td>${esc(when(x.last_received))}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No metrics received.</td></tr>';document.querySelector('#bundleCount').textContent=`· ${fmt(d.summary.bundle_count)} retained`;document.querySelector('#bundles').innerHTML=d.bundles.length?d.bundles.map(x=>`<tr><td>${when(x.created_at)}</td><td>${when(x.expires_at)}</td><td>${fmt(x.bytes/1024)} KB</td><td><a href="/admin/diagnostics/${encodeURIComponent(x.id)}">Download gzip</a></td></tr>`).join(''):'<tr><td colspan="4" class="empty">No support bundles.</td></tr>';document.querySelector('#status').textContent=`Updated ${new Date().toLocaleTimeString()} · signal breakdown covers ${fmt(d.packages_scanned)} packages.`}document.querySelector('#reload').onclick=load;document.querySelector('#days').onchange=load;load();
</script></body></html>"""


@router.get("/admin", response_class=HTMLResponse)
def dashboard(request: Request) -> HTMLResponse:
    authorize(request)
    return HTMLResponse(PAGE, headers={"Cache-Control": "private, no-store"})


@router.get("/admin/data")
def dashboard_data(
    request: Request, days: int = Query(default=30, ge=7, le=90)
) -> Response:
    authorize(request)
    from app import _connection

    now = int(time.time())
    cutoff = now - days * 86400
    with _connection() as db:
        summary = db.execute(
            "SELECT COUNT(*) AS packages,COUNT(DISTINCT install_hash) AS installs FROM shared_metrics_packages WHERE received_at>=?",
            (cutoff,),
        ).fetchone()
        packages = db.execute(
            "SELECT install_hash,payload_json,received_at FROM shared_metrics_packages WHERE received_at>=? ORDER BY received_at DESC LIMIT ?",
            (cutoff, 20_000),
        ).fetchall()
        bundle_count = db.execute(
            "SELECT COUNT(*) AS count FROM diagnostics_bundles WHERE expires_at>?",
            (now,),
        ).fetchone()["count"]
        bundles = db.execute(
            "SELECT token_hash AS id,created_at,expires_at,length(bundle) AS bytes FROM diagnostics_bundles WHERE expires_at>? ORDER BY created_at DESC LIMIT 100",
            (now,),
        ).fetchall()
    daily_counts: dict[str, int] = {}
    systems: dict[str, set[str]] = {}
    versions: dict[str, set[str]] = {}
    signals: dict[str, dict[str, int]] = {}
    signal_total = 0
    for row in packages:
        received = int(row["received_at"])
        day = time.strftime("%Y-%m-%d", time.gmtime(received))
        daily_counts[day] = daily_counts.get(day, 0) + 1
        try:
            payload: dict[str, Any] = json.loads(row["payload_json"])
        except (TypeError, json.JSONDecodeError):
            continue
        resource = payload.get("resource")
        resource = resource if isinstance(resource, dict) else {}
        install_hash = str(row["install_hash"])
        systems.setdefault(str(resource.get("os_family", "unknown")), set()).add(
            install_hash
        )
        versions.setdefault(str(resource.get("hermes_version", "unknown")), set()).add(
            install_hash
        )
        metrics = payload.get("metrics")
        if not isinstance(metrics, list):
            continue
        for metric in metrics:
            if not isinstance(metric, dict) or not isinstance(metric.get("name"), str):
                continue
            value = metric.get("value", 0)
            if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                continue
            signal = signals.setdefault(
                metric["name"], {"total": 0, "packages": 0, "last_received": 0}
            )
            signal["total"] += value
            signal["packages"] += 1
            signal["last_received"] = max(signal["last_received"], received)
            signal_total += value
    daily = []
    for offset in range(days, -1, -1):
        day = time.strftime("%Y-%m-%d", time.gmtime(now - offset * 86400))
        daily.append({"day": day, "count": daily_counts.get(day, 0)})
    data = {
        "summary": {
            "installs": int(summary["installs"]),
            "packages": int(summary["packages"]),
            "signal_total": signal_total,
            "bundle_count": int(bundle_count),
        },
        "daily": daily,
        "systems": [
            {"name": name, "count": len(seen)}
            for name, seen in sorted(systems.items(), key=lambda x: -len(x[1]))
        ],
        "versions": [
            {"name": name, "count": len(seen)}
            for name, seen in sorted(versions.items(), key=lambda x: -len(x[1]))[:8]
        ],
        "signals": [
            {"name": name, **value}
            for name, value in sorted(signals.items(), key=lambda x: -x[1]["total"])[
                :40
            ]
        ],
        "bundles": [dict(row) for row in bundles],
        "packages_scanned": len(packages),
    }
    return Response(
        json.dumps(data),
        media_type="application/json",
        headers={"Cache-Control": "private, no-store"},
    )


@router.get("/admin/diagnostics/{bundle_id}")
def download_diagnostics(bundle_id: str, request: Request) -> Response:
    authorize(request)
    if not re.fullmatch(r"[0-9a-f]{64}", bundle_id):
        raise HTTPException(404, "Diagnostics bundle not found or expired.")
    from app import _connection

    with _connection() as db:
        row = db.execute(
            "SELECT bundle FROM diagnostics_bundles WHERE token_hash=? AND expires_at>?",
            (bundle_id, int(time.time())),
        ).fetchone()
    if row is None:
        raise HTTPException(404, "Diagnostics bundle not found or expired.")
    return Response(
        bytes(row["bundle"]),
        media_type="application/gzip",
        headers={
            "Content-Disposition": 'attachment; filename="kova-diagnostics.gz"',
            "Cache-Control": "private, no-store",
        },
    )
