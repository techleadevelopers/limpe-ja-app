# analyze_backend_v2.py
# Usage:
#   python analyze_backend_v2.py "C:/Users/Paulo/Desktop/relax-app/backend-cleaning/src"
#
# Outputs:
#   backend_report.json
#   backend_report.md

import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict

# ---------------- CONFIG ---------------- #

HTTP_DECORATORS = ("Get", "Post", "Put", "Patch", "Delete", "Options", "Head", "All")

KEYWORD_BLACKLIST = {
    "if","for","while","switch","return","catch","typeof",
    "parseInt","parseFloat","Number","String","Boolean"
}

INTERESTING_DECORATORS = {
    "UseGuards","Roles","ApiBearerAuth","ApiTags",
    "ApiOperation","ApiResponse","HttpCode"
}

# ---------------- REGEX ---------------- #

HTTP_RE = re.compile(r"@(" + "|".join(HTTP_DECORATORS) + r")\s*\(\s*([^)]+)?\s*\)", re.M)
CONTROLLER_RE = re.compile(r"@Controller\s*\(\s*([^)]+)?\s*\)", re.M)
CLASS_RE = re.compile(r"export\s+class\s+([A-Za-z0-9_]+)")
METHOD_RE = re.compile(r"^\s*(public|private|protected)?\s*(async\s+)?([A-Za-z0-9_]+)\s*\(", re.M)
IMPORT_RE = re.compile(r"^\s*import\s+(.+?)\s+from\s+['\"](.+?)['\"]", re.M)
INJECT_RE = re.compile(r"constructor\s*\(([\s\S]*?)\)\s*\{")
DECORATOR_LINE_RE = re.compile(r"^\s*@([A-Za-z0-9_]+)\b(.*)$", re.M)

PRISMA_CALL_RE = re.compile(
    r"\bprisma\.(\w+)\.(findUnique|findFirst|findMany|create|createMany|update|updateMany|delete|deleteMany|upsert|aggregate|count|groupBy)\b"
)

THIS_CALL_RE = re.compile(r"\bthis\.([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*\(")
STATUS_RE = re.compile(r"status\s*[:=]\s*['\"]([A-Z_]+)['\"]")
VALIDATOR_RE = re.compile(r"@(Is[A-Za-z]+)\b")

# ---------------- HELPERS ---------------- #

def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")

EXCLUDED_DIRS = {
    "node_modules",
    "dist",
    "test",
    "uploads",
    ".expo",
    "docs",
    "scripts",
}

def find_ts_files(root: Path):
    collected = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d
            for d in dirnames
            if d not in EXCLUDED_DIRS and not d.startswith(".")
        ]
        for filename in filenames:
            if filename.endswith(".ts"):
                collected.append(Path(dirpath) / filename)
    return collected

def file_kind(path: Path):
    n = path.name
    if n.endswith(".controller.ts"): return "controller"
    if n.endswith(".service.ts"): return "service"
    if n.endswith(".module.ts"): return "module"
    if n.endswith(".dto.ts"): return "dto"
    if n.endswith(".entity.ts"): return "entity"
    return "ts"

def strip_quotes(s: str):
    if not s: return ""
    s = s.strip()
    if s[0] in "\"'`" and s[-1] == s[0]:
        return s[1:-1]
    return s

def extract_class_name(text):
    m = CLASS_RE.search(text)
    return m.group(1) if m else ""

def extract_imports(text):
    return [{"what": m.group(1), "from": m.group(2)} for m in IMPORT_RE.finditer(text)]

def extract_injections(text):
    m = INJECT_RE.search(text)
    if not m: return []
    parts = [p.strip() for p in m.group(1).split(",") if p.strip()]
    out = []
    for p in parts:
        p = re.sub(r"@\w+\([^)]+\)", "", p)
        m2 = re.search(r"(\w+)\s*:\s*([\w<>]+)", p)
        out.append(m2.groupdict() if m2 else {"raw": p})
    return out

def extract_methods(text):
    if "export class" not in text:
        return []
    out, seen = [], set()
    for m in METHOD_RE.finditer(text):
        name = m.group(3)
        if name == "constructor" or name in KEYWORD_BLACKLIST:
            continue
        if name not in seen:
            seen.add(name)
            out.append(name)
    return out

def extract_statuses(text):
    return sorted(set(m.group(1) for m in STATUS_RE.finditer(text)))

def extract_prisma(text):
    usage = defaultdict(lambda: defaultdict(int))
    for m in PRISMA_CALL_RE.finditer(text):
        usage[m.group(1)][m.group(2)] += 1
    return [{"model": k, "ops": dict(v)} for k, v in usage.items()]

def extract_validators(text):
    return sorted(set(VALIDATOR_RE.findall(text)))

def extract_this_calls_by_method(text):
    blocks = {}
    current = None
    for line in text.splitlines():
        m = METHOD_RE.match(line)
        if m and m.group(3) not in KEYWORD_BLACKLIST:
            current = m.group(3)
            blocks[current] = defaultdict(list)
        if current:
            for c in THIS_CALL_RE.finditer(line):
                blocks[current][c.group(1)].append(c.group(2))
    return {k: dict(v) for k, v in blocks.items() if v}

def extract_routes(text):
    base = ""
    m = CONTROLLER_RE.search(text)
    if m:
        base = strip_quotes(m.group(1) or "")
    routes = []
    seen = set()
    for h in HTTP_RE.finditer(text):
        method = h.group(1).upper()
        path = strip_quotes(h.group(2) or "")
        decorators = []
        for d in DECORATOR_LINE_RE.finditer(text[:h.start()]):
            if d.group(1) in INTERESTING_DECORATORS:
                decorators.append(d.group(0).strip())
        after = text[h.end():]
        mm = METHOD_RE.search(after)
        handler = mm.group(3) if mm else ""
        full = "/" + "/".join(p for p in [base, path] if p).strip("/")
        if not handler:
            continue
        key = (method, full, handler)
        if key in seen:
            continue
        seen.add(key)
        routes.append({
            "http": method,
            "path": full,
            "handler": handler,
            "decorators": decorators
        })
    return routes

# ---------------- MAIN ---------------- #

def main():
    root = Path(sys.argv[1]).resolve()
    files = find_ts_files(root)

    report = {
        "root": str(root),
        "files_scanned": len(files),
        "controllers": [],
        "services": [],
        "dtos": [],
        "entities": [],
        "routes": []
    }

    for f in files:
        text = read_text(f)
        kind = file_kind(f)
        cls = extract_class_name(text)

        base = {
            "file": str(f.relative_to(root)),
            "class": cls,
            "imports": extract_imports(text)
        }

        if kind == "controller":
            base["routes"] = extract_routes(text)
            report["controllers"].append(base)
            report["routes"] += base["routes"]

        elif kind == "service":
            base["methods"] = extract_methods(text)
            base["status_transitions"] = extract_statuses(text)
            base["prisma"] = extract_prisma(text)
            base["calls_by_method"] = extract_this_calls_by_method(text)
            base["injects"] = extract_injections(text)
            report["services"].append(base)

        elif kind == "dto":
            base["validators"] = extract_validators(text)
            report["dtos"].append(base)

        elif kind == "entity":
            report["entities"].append(base)

    Path("backend_report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    md = [
        "# Backend Business Analysis",
        f"- Files scanned: **{report['files_scanned']}**",
        f"- Controllers: **{len(report['controllers'])}**",
        f"- Services: **{len(report['services'])}**",
        f"- DTOs: **{len(report['dtos'])}**",
        ""
    ]

    md.append("## Routes\n")
    for r in report["routes"]:
        md.append(f"- **{r['http']}** `{r['path']}` → `{r['handler']}`")

    md.append("\n## Services\n")
    for s in report["services"]:
        md.append(f"### `{s['class']}` ({s['file']})")
        if s["status_transitions"]:
            md.append(f"- Status: {', '.join(s['status_transitions'])}")
        if s["prisma"]:
            for p in s["prisma"]:
                md.append(f"- Prisma `{p['model']}`: {p['ops']}")
        if s["calls_by_method"]:
            md.append("- Calls:")
            for m, c in s["calls_by_method"].items():
                md.append(f"  - `{m}` → {c}")
        md.append("")

    Path("backend_report.md").write_text("\n".join(md), encoding="utf-8")

    print("backend_report.json + backend_report.md gerados")

if __name__ == "__main__":
    main()
