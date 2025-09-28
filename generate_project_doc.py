import os
import sys
import argparse
import shutil
from pathlib import Path

# Map de extensões para linguagens para o fence do Markdown
EXT_LANG = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.cs': 'csharp',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.json': 'json',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.sh': 'bash',
    '.ps1': 'powershell',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.sql': 'sql',
    '.txt': '',
    # adicione mais se quiser
}

DEFAULT_EXCLUDE_DIRS = {
    '.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build', '.DS_Store'
}
DEFAULT_EXCLUDE_FILES = {
    '.env', '.env.local', '.env.*', 'secret.key'
}

def is_text_file(path: Path) -> bool:
    # heurística simples baseada em extensão
    return path.suffix.lower() in EXT_LANG or path.suffix.lower() in {
        '.txt', '.md', '.cfg', '.ini', '.dockerfile', '.makefile', '.json', '.yml', '.yaml'
    }

def gather_files(root: Path, exclude_dirs=DEFAULT_EXCLUDE_DIRS, exclude_files=DEFAULT_EXCLUDE_FILES):
    files = []
    for p in root.rglob('*'):
        if p.is_dir():
            if p.name in exclude_dirs:
                # p.rmdir()  # não removemos, apenas pulamos
                # skip the whole directory by using rglob logic: continue, but rglob will still explore; better to check parents below
                continue
        if p.is_file():
            # skip if any parent dir is in exclude_dirs
            if any(part in exclude_dirs for part in p.parts):
                continue
            # skip specific filenames
            if p.name in exclude_files:
                continue
            # skip binary by extension; conservative: only include text-like
            if is_text_file(p):
                files.append(p)
    # sort for deterministic order
    files.sort()
    return files

def language_for_file(path: Path):
    return EXT_LANG.get(path.suffix.lower(), '')

def write_aggregate_md(files, out_path: Path, project_root: Path):
    with out_path.open('w', encoding='utf-8') as f:
        f.write(f"# Project Aggregate\n\n")
        f.write(f"- Generated from: `{project_root.resolve()}`\n")
        f.write(f"- Files included: {len(files)}\n\n---\n\n")
        for p in files:
            rel = p.relative_to(project_root)
            f.write(f"## {rel}\n\n")
            lang = language_for_file(p)
            fence = f"```{lang}" if lang else "```"
            f.write(f"{fence}\n")
            try:
                text = p.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                try:
                    text = p.read_text(encoding='latin-1')
                except Exception as e:
                    text = f"/* Could not read file due to: {e} */"
            # optional: truncate very long files? (here we include all)
            f.write(text.rstrip() + "\n")
            f.write("```\n\n")
    print(f"Markdown aggregate written to: {out_path}")

def make_zip(root: Path, files, zip_base_name: str):
    zip_root = zip_base_name
    # create a temp dir with relative layout or use shutil.make_archive on whole root - but avoid excluded files
    # We'll create a zip with the selected files preserving relative paths
    import zipfile
    zip_name = f"{zip_base_name}.zip"
    with zipfile.ZipFile(zip_name, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for p in files:
            rel = p.relative_to(root)
            z.write(p, arcname=str(rel))
    print(f"ZIP criado: {zip_name}")
    return zip_name

def main():
    parser = argparse.ArgumentParser(description="Gerar um documento com todo o código do projeto")
    parser.add_argument("root", nargs='?', default='.', help="pasta do projeto (default: .)")
    parser.add_argument("--out", "-o", default="project_aggregate.md", help="arquivo de saída Markdown")
    parser.add_argument("--zip", action='store_true', help="criar ZIP com os arquivos incluídos")
    parser.add_argument("--exclude-dir", action='append', help="adicionar pasta a excluir (pode usar múltiplas vezes)")
    parser.add_argument("--exclude-file", action='append', help="adicionar nome de arquivo a excluir (pode usar múltiplas vezes)")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print("Pasta não encontrada:", root)
        sys.exit(1)

    exclude_dirs = set(DEFAULT_EXCLUDE_DIRS)
    exclude_files = set(DEFAULT_EXCLUDE_FILES)
    if args.exclude_dir:
        exclude_dirs.update(args.exclude_dir)
    if args.exclude_file:
        exclude_files.update(args.exclude_file)

    files = gather_files(root, exclude_dirs=exclude_dirs, exclude_files=exclude_files)
    if not files:
        print("Nenhum arquivo de texto encontrado para incluir.")
        sys.exit(0)

    out_path = Path(args.out)
    write_aggregate_md(files, out_path, root)

    if args.zip:
        make_zip(root, files, zip_base_name=f"{root.name}_files")

if __name__ == "__main__":
    main()