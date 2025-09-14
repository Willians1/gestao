<?php
require_once __DIR__ . '/config.php';

echo "DB: ".realpath(__DIR__ . '/../backend/gestao_obras.db')."\n";

try {
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll();
    echo "Tabelas:"."\n";
    foreach ($tables as $t) {
        echo " - ".$t['name']."\n";
    }
    echo "\nSchema usuarios:"."\n";
    $cols = $pdo->query("PRAGMA table_info(usuarios)")->fetchAll();
    foreach ($cols as $c) {
        echo " - {$c['name']} {$c['type']}\n";
    }
    echo "\nUsuarios:"."\n";
    $rows = $pdo->query("SELECT id, username, nome, nivel_acesso, ativo FROM usuarios LIMIT 20")->fetchAll();
    foreach ($rows as $r) {
        echo " - #{$r['id']} ".$r['username']." (".($r['nome'] ?? '').") nivel=".($r['nivel_acesso'] ?? '')." ativo=".($r['ativo'] ? '1':'0')."\n";
    }
} catch (Throwable $e) {
    echo "Erro: ".$e->getMessage()."\n";
}

?>
