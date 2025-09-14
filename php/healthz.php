<?php
header('Content-Type: application/json; charset=utf-8');

$result = [
  'status' => 'starting',
  'php_version' => PHP_VERSION,
  'extensions' => [
    'pdo_sqlite' => extension_loaded('pdo_sqlite'),
    'sqlite3' => extension_loaded('sqlite3'),
  ],
  'db' => [
    'path' => null,
    'exists' => null,
    'can_connect' => null,
    'admin_exists' => null,
  ]
];

// DB path: tenta a env e cai para o caminho do container
$dbPath = getenv('PHP_DB_PATH');
if (!$dbPath) {
  $dbPath = __DIR__ . '/gestao_obras.db';
}
$result['db']['path'] = $dbPath;
$result['db']['exists'] = file_exists($dbPath);

try {
  $pdo = new PDO('sqlite:' . $dbPath);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $result['db']['can_connect'] = true;
  // verifica tabela usuarios
  $hasTable = (bool) $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")->fetch();
  if ($hasTable) {
    $count = (int) $pdo->query("SELECT COUNT(*) FROM usuarios WHERE username='admin'")->fetchColumn();
    $result['db']['admin_exists'] = $count > 0;
  } else {
    $result['db']['admin_exists'] = false;
  }
  $result['status'] = 'ok';
} catch (Throwable $e) {
  $result['db']['can_connect'] = false;
  $result['error'] = $e->getMessage();
  $result['status'] = 'error';
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;
