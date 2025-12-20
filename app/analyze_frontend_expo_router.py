# Usage:
#   python analyze_frontend_expo_router.py "C:/Users/Paulo/Desktop/relax-app/app"
#
# Outputs:
#   frontend_routes.json
#   frontend_routes.md

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from typing import List

PAGE_FILES = {"index.tsx", "index.jsx", "index.ts", "index.js"}
LAYOUT_FILES = {"_layout.tsx", "_layout.jsx", "_layout.ts", "_layout.js"}
NOTFOUND_FILES = {"+not-found.tsx", "+not-found.jsx", "+not-found.ts", "+not-found.js"}

# Rough patterns to spot navigation calls (optional signal)
NAV_CALL_RE = re.compile(
    r"""
    (?:router\.(?:push|replace|back)\s*\(\s*   # router.push(...)
    |(?:navigate|push|replace)\s*\(\s*         # navigate(...)
    )
    (?P<arg>[^)]+)
    \)
    """,
    re.VERBOSE | re.MULTILINE,
)

STRING_LIT_RE = re.compile(r"^(['\"`])([\s\S]*?)\1$")

def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return p.read_text(errors="replace")

def is_group(seg: str) -> bool:
    # auth, client etc
    return seg.startswith("(") and seg.endswith(")")

def seg_to_route(seg: str) -> str:
    # [id] -> :id, [...slug] -> *slug (catch-all)
    if seg.startswith("[...") and seg.endswith("]"):
        name = seg[4:-1].strip()
        return f"*{name}" if name else "*"
    if seg.startswith("[") and seg.endswith("]"):
        name = seg[1:-1].strip()
        return f":{name}" if name else ":param"
    return seg

def normalize_route(path_parts: List[str]) -> str:
    # drop groups, convert segments, join
    out = []
    for seg in path_parts:
        if is_group(seg):
            continue
        out.append(seg_to_route(seg))
    route = "/" + "/".join([s for s in out if s])
    route = route.replace("//", "/")
    return route if route != "" else "/"

def walk_app(app_dir: Path):
    """
    Collect:
      - pages: index files become routes
      - layouts: _layout files (not routes)
      - +not-found markers
    """
    items = []
    for p in app_dir.rglob("*"):
        if not p.is_file():
            continue
        if p.name.startswith("."):
            continue
        if p.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
            continue
        rel = p.relative_to(app_dir)
        parts = list(rel.parts)

        kind = "other"
        if p.name in PAGE_FILES:
            kind = "page"
        elif p.name in LAYOUT_FILES:
            kind = "layout"
        elif p.name in NOTFOUND_FILES:
            kind = "not_found"

        items.append({
            "file": str(p),
            "rel": str(rel).replace("\\", "/"),
            "name": p.name,
            "kind": kind,
            "parts": [x for x in parts],
        })
    return items

def route_for_page(item) -> str:
    # route is based on folder path containing index.tsx
    # example: app/provider/schedule/index.tsx -> /schedule
    # example: app/client/booking/[id]/index.tsx -> /booking/:id
    parts = item["parts"]
    # remove filename
    parts = parts[:-1]
    return normalize_route(parts)

def extract_nav_calls(text: str):
    out = []
    for m in NAV_CALL_RE.finditer(text):
        raw = m.group("arg").strip()
        # try to pull first argument
        first = raw.split(",")[0].strip()
        if STRING_LIT_RE.match(first):
            lit = STRING_LIT_RE.match(first).group(2)
            out.append({"type": "literal", "value": lit})
        else:
            out.append({"type": "expr", "value": first[:160]})
    return out

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_frontend_expo_router.py <path-to-app>")
        sys.exit(1)

    app_dir = Path(sys.argv[1]).expanduser().resolve()
    if not app_dir.exists() or not app_dir.is_dir():
        print(f"App dir not found: {app_dir}")
        sys.exit(1)

    items = walk_app(app_dir)

    pages = []
    layouts = []
    not_found = []
    others = []

    route_index = []
    route_to_files = defaultdict(list)

    nav_index = []  # file -> nav calls (optional)
    nav_targets_literal = defaultdict(list)  # "/booking/123" -> [files...]

    for it in items:
        p = app_dir / it["rel"]
        text = read_text(p)

        # collect nav calls for any file under app/
        nav_calls = extract_nav_calls(text)
        if nav_calls:
            nav_index.append({
                "rel": it["rel"],
                "calls": nav_calls
            })
            for c in nav_calls:
                if c["type"] == "literal":
                    nav_targets_literal[c["value"]].append(it["rel"])

        if it["kind"] == "page":
            route = route_for_page(it)
            rec = {
                "route": route,
                "file": it["rel"],
                "segments": [s for s in it["parts"][:-1]],
                "has_group": any(is_group(s) for s in it["parts"]),
            }
            pages.append(rec)
            route_index.append(rec)
            route_to_files[route].append(it["rel"])
        elif it["kind"] == "layout":
            layouts.append({"file": it["rel"], "segments": it["parts"][:-1]})
        elif it["kind"] == "not_found":
            not_found.append({"file": it["rel"], "segments": it["parts"][:-1]})
        else:
            others.append({"file": it["rel"]})

    # detect duplicates (same route defined in multiple places)
    duplicates = {r: fs for r, fs in route_to_files.items() if len(fs) > 1}

    report = {
        "root": str(app_dir).replace("\\", "/"),
        "files_scanned": len(items),
        "pages": pages,
        "layouts": layouts,
        "not_found_files": not_found,
        "route_index": sorted(route_index, key=lambda x: (x["route"], x["file"])),
        "duplicates": duplicates,
        "nav_calls": nav_index,
        "nav_literal_targets": dict(sorted(nav_targets_literal.items(), key=lambda x: x[0])),
    }

    out_json = Path.cwd() / "frontend_routes.json"
    out_md = Path.cwd() / "frontend_routes.md"

    out_json.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    md = []
    md.append("# Frontend (Expo Router) Report\n")
    md.append(f"- Root: `{report['root']}`")
    md.append(f"- Files scanned: **{report['files_scanned']}**")
    md.append(f"- Pages (index.*): **{len(report['pages'])}**")
    md.append(f"- Layouts (_layout.*): **{len(report['layouts'])}**")
    md.append(f"- Not found files (+not-found.*): **{len(report['not_found_files'])}**")
    md.append("")

    md.append("## Routes (derived from index.*)\n")
    for r in report["route_index"]:
        flag = " (grouped)" if r["has_group"] else ""
        md.append(f"- `{r['route']}` → `{r['file']}`{flag}")
    md.append("")

    if report["duplicates"]:
        md.append("## ⚠️ Duplicate Routes (same URL, multiple pages)\n")
        for route, files in sorted(report["duplicates"].items(), key=lambda x: x[0]):
            md.append(f"- `{route}`")
            for f in files:
                md.append(f"  - {f}")
        md.append("")

    md.append("## Layouts\n")
    for l in sorted(report["layouts"], key=lambda x: x["file"]):
        md.append(f"- `{l['file']}`")
    md.append("")

    md.append("## Not Found handlers\n")
    for nf in sorted(report["not_found_files"], key=lambda x: x["file"]):
        md.append(f"- `{nf['file']}`")
    md.append("")

    if report["nav_calls"]:
        md.append("## Navigation calls found (router.push/navigate)\n")
        for n in sorted(report["nav_calls"], key=lambda x: x["rel"]):
            md.append(f"### `{n['rel']}`")
            for c in n["calls"]:
                md.append(f"- {c['type']}: {c['value']}")
            md.append("")

    out_md.write_text("\n".join(md), encoding="utf-8")
    print(f"OK: wrote {out_json} and {out_md}")

if __name__ == "__main__":
    main()
