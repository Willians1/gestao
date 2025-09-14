import subprocess
import sys

def run_sqlite_command():
    try:
        # Tentar executar sqlite3 diretamente
        result = subprocess.run(
            ['sqlite3', 'gestao_obras.db', '.schema usuarios'],
            capture_output=True,
            text=True,
            cwd='.'
        )
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
    except Exception as e:
        print(f"Erro ao executar sqlite3: {e}")

if __name__ == "__main__":
    run_sqlite_command()
