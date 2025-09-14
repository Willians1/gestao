<?php
// Configuração do SQLite: usa variável de ambiente PHP_DB_PATH (deploy) ou cai para backend/gestao_obras.db (local)
$dbPath = getenv('PHP_DB_PATH');
if (!$dbPath) {
    $dbPath = __DIR__ . '/../backend/gestao_obras.db';
}
if (!file_exists($dbPath)) {
    http_response_code(500);
    die('Banco de dados não encontrado: ' . htmlspecialchars($dbPath));
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    die('Falha ao conectar ao banco: ' . htmlspecialchars($e->getMessage()));
}

function hash_password(string $password): string {
    return hash('sha256', $password);
}

// Seed opcional: garante existência de admin/admin se tabela existir
try {
    $existsStmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'");
    $tableExists = (bool) $existsStmt->fetch();
    if ($tableExists) {
        $checkAdmin = $pdo->prepare('SELECT id FROM usuarios WHERE username = :u LIMIT 1');
        $checkAdmin->execute([':u' => 'admin']);
        if (!$checkAdmin->fetch()) {
            $seed = $pdo->prepare('INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo) VALUES (:u, :p, :n, :e, :nv, 1)');
            $seed->execute([
                ':u' => 'admin',
                ':p' => hash_password('admin'),
                ':n' => 'Administrador',
                ':e' => null,
                ':nv' => 'admin',
            ]);
        }
    }
} catch (Throwable $e) {
    // Não interrompe a aplicação em caso de erro no seed
}
