import json
import re
import sys
from pathlib import Path
from collections import defaultdict

JS_EXT = {".js", ".jsx", ".ts", ".tsx"}

# Navegação explícita
NAV_RE = re.compile(
    r"""
    router\.(push|replace)\s*\(([^)]+)\)
    |navigate\s*\(([^)]+)\)
    |<Link[^>]*?href\s*=\s*({[^}]+}|["'`][^"'`]+["'`])
    """,
    re.VERBOSE | re.MULTILINE,
)

# Literais perigosos
STRING_LIT_RE = re.compile(r"(['\"`])([^\"'`]+)\1")

# Regras de negócio suspeitas no frontend
BUSINESS_RULE_RE = re.compile(
    r"""
    booking\.status
    |user\.role
    |provider\.
    |pricePerHour
    |verificationStatus
    |FINISHED|PENDING|STARTED|COMPLETED|CANCELED
    |ADMIN|CLIENT|PROVIDER
    """,
    re.VERBOSE,
)

def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""

def analyze_components(root: Path):
    nav_calls = []
    literals = defaultdict(list)
    business_rules = []

    for p in root.rglob("*"):
        if not p.is_file() or p.suffix not in JS_EXT:
            continue

        text = read_text(p)
        rel = str(p.relative_to(root)).replace("\\", "/")

        # Navegação
        for m in NAV_RE.finditer(text):
            raw = next(g for g in m.groups() if g)
            call = {
                "file": rel,
                "raw": raw.strip()[:200],
                "type": "expr"
            }

            lit = STRING_LIT_RE.search(raw)
            if lit:
                call["type"] = "literal"
                call["value"] = lit.group(2)
                literals[lit.group(2)].append(rel)

            nav_calls.append(call)

        # Regra de negócio no UI
        if BUSINESS_RULE_RE.search(text):
            business_rules.append(rel)

    return {
        "components_root": str(root).replace("\\", "/"),
        "files_scanned": len(list(root.rglob("*"))),
        "navigation_calls": nav_calls,
        "navigation_literal_targets": dict(literals),
        "ui_business_rule_files": sorted(set(business_rules)),
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_components.py <components-path>")
        sys.exit(1)

    root = Path(sys.argv[1]).resolve()
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(1)

    report = analyze_components(root)

    Path("components_analysis.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("OK: wrote components_analysis.json")

if __name__ == "__main__":
    main()
