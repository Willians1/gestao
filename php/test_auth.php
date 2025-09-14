<?php
// Teste rápido via CLI: php test_auth.php
require_once __DIR__ . '/config.php';

function out($msg) { echo $msg, PHP_EOL; }

try {
    // Garante seed admin/admin já foi executado em config.php
    $stmt = $pdo->prepare('SELECT id, username, hashed_password, ativo FROM usuarios WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => 'admin']);
    $user = $stmt->fetch();
    if (!$user) {
        out('FAIL: Usuário admin não existe.');
        exit(1);
    }
    if ((int)$user['ativo'] === 0) {
        out('FAIL: Usuário admin está inativo.');
        exit(1);
    }
    $expected = hash_password('admin');
    if ($expected === $user['hashed_password']) {
        out('PASS: admin/admin válido.');
        exit(0);
    }
    out('FAIL: Senha do admin não é "admin".');
    exit(2);
} catch (Throwable $e) {
    out('ERROR: ' . $e->getMessage());
    exit(99);
}
