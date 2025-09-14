<?php
require_once __DIR__ . '/config.php';
session_start();
if (empty($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
$user = $_SESSION['user'];
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Início - Gestão</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f5f7fb; margin:0; }
    header { background:#111827; color:#fff; padding:14px 20px; display:flex; justify-content:space-between; align-items:center; }
    .brand { font-weight:700; }
    .container { padding:20px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.06); padding:18px; }
    .btn { padding:8px 12px; background:#ef4444; color:#fff; border:none; border-radius:8px; cursor:pointer; }
    .btn:hover { background:#dc2626; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Gestão</div>
    <form method="post" action="logout.php"><button class="btn" type="submit">Sair</button></form>
  </header>
  <div class="container">
    <div class="card">
      <h2>Bem-vindo, <?php echo htmlspecialchars($user['nome'] ?: $user['username']); ?>!</h2>
      <p>Nível de acesso: <strong><?php echo htmlspecialchars($user['nivel_acesso']); ?></strong></p>
      <p>Este é um painel simples em PHP usando o mesmo banco de dados do sistema.</p>
    </div>
  </div>
</body>
</html>
