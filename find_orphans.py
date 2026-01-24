import os
import re
from pathlib import Path

# --- CONFIGURAÇÃO ---
PROJECT_ROOT = Path("C:/Users/Paulo/Desktop/relax-app")
APP_DIR = PROJECT_ROOT / "app"
COMPONENTS_DIR = PROJECT_ROOT / "components"
HOOKS_DIR = PROJECT_ROOT / "hooks"

EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

def find_orphans():
    all_files = {}
    used_files = set()

    # 1. Mapeia todos os arquivos (App, Components, Hooks)
    for folder in [APP_DIR, COMPONENTS_DIR, HOOKS_DIR]:
        if not folder.exists(): continue
        for p in folder.rglob("*"):
            if p.suffix in EXTENSIONS:
                all_files[str(p.resolve())] = p

    # 2. Define que todas as telas na pasta /app são "raízes" (usadas pelo roteador)
    for path_str, file_path in all_files.items():
        if str(APP_DIR.resolve()) in path_str:
            used_files.add(path_str)

    # 3. Varre todos os arquivos em busca de imports
    # (Inclusive as telas da /app buscam componentes, então precisamos ler elas)
    import_re = re.compile(r"from\s+['\"](.+?)['\"]|import\s+['\"](.+?)['\"]")

    for path_str, file_path in all_files.items():
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            matches = import_re.findall(content)
            
            for m in matches:
                imp_path = next(s for s in m if s)
                
                # Resolve caminhos relativos (./ ou ../) ou aliases (@/)
                if imp_path.startswith(".") or imp_path.startswith("@/"):
                    # Se usar alias @/, precisamos ajustar para o root, se não, usa o pai do arquivo
                    base_path = PROJECT_ROOT if imp_path.startswith("@/") else file_path.parent
                    clean_imp = imp_path.replace("@/", "")
                    
                    resolved = (base_path / clean_imp).resolve()
                    
                    # Checa variações de extensão e pastas index
                    for ext in EXTENSIONS:
                        possible_paths = [
                            str(resolved) + ext,
                            str(resolved / "index") + ext
                        ]
                        for pp in possible_paths:
                            if pp in all_files:
                                used_files.add(pp)
        except Exception as e:
            pass

    # 4. Filtra apenas órfãos de Components e Hooks
    orphans = []
    for path_str in all_files:
        if path_str not in used_files:
            # Só nos interessam órfãos que NÃO estão na pasta app (já que app são rotas)
            if str(APP_DIR.resolve()) not in path_str:
                orphans.append(path_str)

    print(f"\n--- AUDITORIA DE FRONTEND (COMPONENTS & HOOKS) ---")
    print(f"Total de arquivos mapeados: {len(all_files)}")
    print(f"Órfãos reais encontrados: {len(orphans)}")
    print("-" * 50)
    for o in sorted(orphans):
        print(f"DELETÁVEL: {o.replace(str(PROJECT_ROOT), '')}")

if __name__ == "__main__":
    find_orphans()