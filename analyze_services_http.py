import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

TS_EXT = {".ts", ".tsx"}
EXCLUDED_DIRS = {
    "node_modules",
    "dist",
    "uploads",
    "test",
    ".expo",
    "docs",
    "scripts",
}

API_CALL_RE = re.compile(
    r"\bapi\.(?P<method>get|post|put|patch|delete|request)(?:<[^>]+>)?\s*\(",
    re.IGNORECASE,
)
STRING_LITERAL_RE = re.compile(
    r"(?P<quote>['\"`])(?P<path>(?:\\.|(?!\1).)*?)(?<!\\)(?P=quote)",
    re.S,
)
URL_IN_OBJECT_RE = re.compile(
    r"url\s*:\s*(?P<quote>['\"`])(?P<path>(?:\\.|(?!\1).)*?)(?<!\\)(?P=quote)",
    re.S,
)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return path.read_text(errors="replace")


def iter_ts_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d
            for d in dirnames
            if d not in EXCLUDED_DIRS and not d.startswith(".")
        ]
        for filename in filenames:
            if Path(filename).suffix.lower() not in TS_EXT:
                continue
            yield Path(dirpath) / filename


def line_number(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def extract_path(text: str, start: int):
    rest = text[start:]
    literal = STRING_LITERAL_RE.search(rest)
    if literal:
        return literal.group("path")
    url_match = URL_IN_OBJECT_RE.search(rest)
    if url_match:
        return url_match.group("path")
    return None


def analyze_services(root: Path):
    scanned_files = []
    calls = []
    calls_by_file = defaultdict(list)

    for path in iter_ts_files(root):
        scanned_files.append(path)
        text = read_text(path)
        rel = str(path.relative_to(root)).replace("\\", "/")
        for match in API_CALL_RE.finditer(text):
            method = match.group("method").upper()
            path_value = extract_path(text, match.end())
            line = line_number(text, match.start())
            calls_by_file[rel].append(
                {
                    "line": line,
                    "method": method,
                    "path": path_value,
                }
            )
            calls.append(
                {
                    "file": rel,
                    "line": line,
                    "method": method,
                    "path": path_value,
                }
            )

    unique_endpoints = defaultdict(int)
    for call in calls:
        key = (call["method"], call["path"] or "<dynamic>")
        unique_endpoints[key] += 1

    files_without_calls = [
        str(p.relative_to(root)).replace("\\", "/")
        for p in scanned_files
        if str(p.relative_to(root)).replace("\\", "/") not in calls_by_file
    ]

    return {
        "root": str(root).replace("\\", "/"),
        "files_scanned": len(scanned_files),
        "http_calls": calls,
        "unique_endpoints": [
            {"method": method, "path": path, "count": count}
            for (method, path), count in sorted(unique_endpoints.items())
        ],
        "files_without_http_calls": sorted(files_without_calls),
        "calls_by_file": {
            filename: sorted(entries, key=lambda item: item["line"])
            for filename, entries in sorted(calls_by_file.items())
        },
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_services_http.py <services-path>")
        sys.exit(1)

    root = Path(sys.argv[1]).resolve()
    if not root.exists() or not root.is_dir():
        print(f"Services path not found: {root}")
        sys.exit(1)

    report = analyze_services(root)
    out_json = Path.cwd() / "services_http_report.json"
    out_md = Path.cwd() / "services_http_report.md"

    out_json.write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    md = [
        "# Services HTTP Report",
        f"- Root: `{report['root']}`",
        f"- TS files scanned: **{report['files_scanned']}**",
        f"- Files with HTTP calls: **{len(report['calls_by_file'])}**",
        f"- Files without HTTP calls: **{len(report['files_without_http_calls'])}**",
        "",
        "## Unique endpoints",
    ]

    if report["unique_endpoints"]:
        for ep in report["unique_endpoints"]:
            md.append(f"- `{ep['method']}` `{ep['path']}` → {ep['count']} call(s)")
    else:
        md.append("- _No HTTP endpoints detected._")

    if report["files_without_http_calls"]:
        md.append("")
        md.append("## Files without API usage")
        for file in report["files_without_http_calls"]:
            md.append(f"- `{file}`")

    md.append("")
    md.append("## Calls by file")

    for filename, entries in report["calls_by_file"].items():
        md.append(f"### `{filename}`")
        for entry in entries:
            path = entry["path"] or "<dynamic>"
            md.append(f"- L{entry['line']}: `{entry['method']}` → `{path}`")
        md.append("")

    out_md.write_text("\n".join(md), encoding="utf-8")
    print(f"OK: wrote {out_json} and {out_md}")


if __name__ == "__main__":
    main()
