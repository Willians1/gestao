import json
import os
import sqlite3
import argparse
from datetime import datetime

try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None


def _ensure_contratos_schema(cur):
    # Garante colunas essenciais para a tela de contratos
    cur.execute("PRAGMA table_info(contratos)")
    cols = {r[1]: r for r in cur.fetchall()}
    needed_text = [
        ("numero", "TEXT"),
        ("cliente", "TEXT"),  # compatibilidade
        ("tipo", "TEXT"),
        ("situacao", "TEXT"),
        ("prazoPagamento", "TEXT"),
        ("quantidadeParcelas", "TEXT"),
        ("arquivo", "TEXT"),
    ]
    needed_num = [
        ("id", "INTEGER"),
        ("cliente_id", "INTEGER"),
        ("valor", "REAL"),
        ("arquivo_upload_id", "INTEGER"),
    ]
    needed_date = [
        ("dataInicio", "TEXT"),
        ("dataFim", "TEXT"),
    ]

    for name, typ in needed_text + needed_num + needed_date:
        if name not in cols:
            if name == "id":
                # id já deve existir, mas se não, cria como PK autoincremento
                cur.execute("ALTER TABLE contratos ADD COLUMN id INTEGER")
            else:
                cur.execute(f"ALTER TABLE contratos ADD COLUMN {name} {typ}")


def _to_date_str(v):
    if v in (None, "", 0):
        return None
    # Aceita já em formato ISO, ou dict/obj pydantic, ou epoch
    if isinstance(v, str):
        # tenta normalizar
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00")).date().isoformat()
        except Exception:
            try:
                return datetime.strptime(v, "%Y-%m-%d").date().isoformat()
            except Exception:
                return None
    try:
        # timestamps numéricos
        return datetime.fromtimestamp(float(v)).date().isoformat()
    except Exception:
        return None


def upsert_contracts(rows: list[dict]):
    if not DB_PATH:
        raise RuntimeError("DB_PATH não disponível (backend não está usando SQLite)")
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        _ensure_contratos_schema(cur)
        conn.commit()

        # Descobrir se coluna legacy 'descricao' existe como NOT NULL sem default
        cur.execute("PRAGMA table_info(contratos)")
        info = {r[1]: r for r in cur.fetchall()}  # name -> row
        has_desc_required = False
        if "descricao" in info:
            notnull = int(info["descricao"][3] or 0)
            dflt = info["descricao"][4]
            has_desc_required = (notnull == 1 and dflt in (None, ""))

        # Upsert por id quando disponível, senão por numero (único lógico)
        for r in rows:
            rid = r.get("id")
            numero = (r.get("numero") or "").strip()
            cliente_id = r.get("cliente_id")
            cliente = r.get("cliente")
            valor = r.get("valor")
            dataInicio = _to_date_str(r.get("dataInicio"))
            dataFim = _to_date_str(r.get("dataFim"))
            tipo = r.get("tipo")
            situacao = r.get("situacao")
            prazoPagamento = r.get("prazoPagamento")
            quantidadeParcelas = r.get("quantidadeParcelas")
            arquivo = r.get("arquivo")
            arquivo_upload_id = r.get("arquivo_upload_id")

            desc_val = r.get("descricao")
            if desc_val in (None, "") and has_desc_required:
                desc_val = ""

            if rid is not None:
                # verifica existência por id
                cur.execute("SELECT 1 FROM contratos WHERE id = ?", (int(rid),))
                if cur.fetchone():
                    if has_desc_required:
                        cur.execute(
                            """
                            UPDATE contratos SET
                              numero=?, cliente_id=?, cliente=?, valor=?, dataInicio=?, dataFim=?,
                              tipo=?, situacao=?, prazoPagamento=?, quantidadeParcelas=?, descricao=?, arquivo=?, arquivo_upload_id=?
                            WHERE id=?
                            """,
                            (
                                numero or None,
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                desc_val,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                                int(rid),
                            ),
                        )
                    else:
                        cur.execute(
                            """
                            UPDATE contratos SET
                              numero=?, cliente_id=?, cliente=?, valor=?, dataInicio=?, dataFim=?,
                              tipo=?, situacao=?, prazoPagamento=?, quantidadeParcelas=?, arquivo=?, arquivo_upload_id=?
                            WHERE id=?
                            """,
                            (
                                numero or None,
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                                int(rid),
                            ),
                        )
                    continue

            # se não atualizou por id, tenta por numero
            if numero:
                cur.execute("SELECT id FROM contratos WHERE numero = ?", (numero,))
                row = cur.fetchone()
                if row:
                    if has_desc_required:
                        cur.execute(
                            """
                            UPDATE contratos SET
                              cliente_id=?, cliente=?, valor=?, dataInicio=?, dataFim=?,
                              tipo=?, situacao=?, prazoPagamento=?, quantidadeParcelas=?, descricao=?, arquivo=?, arquivo_upload_id=?
                            WHERE numero=?
                            """,
                            (
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                desc_val,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                                numero,
                            ),
                        )
                    else:
                        cur.execute(
                            """
                            UPDATE contratos SET
                              cliente_id=?, cliente=?, valor=?, dataInicio=?, dataFim=?,
                              tipo=?, situacao=?, prazoPagamento=?, quantidadeParcelas=?, arquivo=?, arquivo_upload_id=?
                            WHERE numero=?
                            """,
                            (
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                                numero,
                            ),
                        )
                else:
                    if has_desc_required:
                        cur.execute(
                            """
                            INSERT INTO contratos (
                              numero, cliente_id, cliente, valor, dataInicio, dataFim, tipo, situacao,
                              prazoPagamento, quantidadeParcelas, descricao, arquivo, arquivo_upload_id
                            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                            """,
                            (
                                numero,
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                desc_val,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                            ),
                        )
                    else:
                        cur.execute(
                            """
                            INSERT INTO contratos (
                              numero, cliente_id, cliente, valor, dataInicio, dataFim, tipo, situacao,
                              prazoPagamento, quantidadeParcelas, arquivo, arquivo_upload_id
                            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                            """,
                            (
                                numero,
                                int(cliente_id) if cliente_id not in (None, "") else None,
                                cliente,
                                float(valor) if valor not in (None, "") else None,
                                dataInicio,
                                dataFim,
                                tipo,
                                situacao,
                                prazoPagamento,
                                quantidadeParcelas,
                                arquivo,
                                int(arquivo_upload_id) if arquivo_upload_id not in (None, "") else None,
                            ),
                        )
            else:
                # Sem número e sem id: ignora
                continue

        conn.commit()
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Caminho do arquivo JSON com lista de contratos")
    args = ap.parse_args()
    with open(args.json, "r", encoding="utf-8") as f:
        raw = json.load(f)
    # Se o arquivo contiver uma string JSON (dupla serialização), tentar decodificar
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            raise ValueError("JSON inválido: conteúdo é string e não pôde ser decodificado como JSON")
    # Aceita tanto lista direta quanto objetos com propriedade items/data/results/contratos
    if isinstance(raw, list):
        data = raw
    elif isinstance(raw, dict):
        for key in ("items", "data", "results", "contratos"):
            if key in raw and isinstance(raw[key], list):
                data = raw[key]
                break
        else:
            # Se vier um único contrato, transforma em lista
            data = [raw]
    else:
        # Como última tentativa, loga um trecho do conteúdo para diagnóstico
        preview = str(raw)
        if len(preview) > 300:
            preview = preview[:300] + "..."
        raise ValueError("JSON inválido: esperado array ou objeto com lista de contratos")
    upsert_contracts(data)
    print(f"Sincronizados {len(data)} contratos para {DB_PATH}")


if __name__ == "__main__":
    main()
