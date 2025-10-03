"""Gera um backup do banco SQLite atual.

Cria diretório `backups/` na raiz do projeto (um nível acima de backend/) e copia o arquivo DB.
Nome do arquivo: gestao_obras_YYYYMMDD_HHMMSS.db (ou baseado em DB_FILE se definido).
Também gera uma versão compactada .zip opcionalmente (flag --zip).

Uso:
    python backend/scripts/backup_sqlite.py [--zip]
"""
from __future__ import annotations
import argparse
import datetime as dt
import os
import shutil
import zipfile
from pathlib import Path

try:
    from backend.database import DB_PATH  # type: ignore
except Exception:
    try:
        # Fallback: adicionar pasta backend ao sys.path
        import sys
        from pathlib import Path as _P
        sys.path.append(str(_P(__file__).resolve().parents[1]))
        from database import DB_PATH  # type: ignore
    except Exception:
        DB_PATH = None


def backup(sqlite_path: str, do_zip: bool = False) -> tuple[str, str | None]:
    root = Path(__file__).resolve().parent.parent.parent  # raiz do repo
    backups_dir = root / "backups"
    backups_dir.mkdir(exist_ok=True)

    base_name = os.getenv("DB_FILE", "gestao_obras.db").rsplit(".", 1)[0]
    ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    dest_file = backups_dir / f"{base_name}_{ts}.db"
    shutil.copy2(sqlite_path, dest_file)

    zip_path = None
    if do_zip:
        zip_path = backups_dir / f"{dest_file.stem}.zip"
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.write(dest_file, arcname=dest_file.name)
    return str(dest_file), (str(zip_path) if zip_path else None)


def main():
    parser = argparse.ArgumentParser(description="Backup do SQLite da aplicação")
    parser.add_argument("--zip", action="store_true", help="Também gerar arquivo compactado .zip")
    args = parser.parse_args()

    if not DB_PATH or not os.path.exists(DB_PATH):
        print("[ERRO] DB_PATH não disponível ou arquivo inexistente.")
        raise SystemExit(1)

    dest, zip_dest = backup(DB_PATH, args.zip)
    print(f"Backup criado: {dest}")
    if zip_dest:
        print(f"Zip criado: {zip_dest}")

if __name__ == "__main__":
    main()
