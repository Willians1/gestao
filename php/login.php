<?php
require_once __DIR__ . '/config.php';

// Se já estiver logado, redireciona para home
session_start();
if (!empty($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Informe usuário e senha.';
    } else {
        $stmt = $pdo->prepare('SELECT id, username, hashed_password, nome, email, nivel_acesso, ativo FROM usuarios WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $username]);
        $user = $stmt->fetch();
        if ($user && hash_password($password) === $user['hashed_password']) {
            if ((int)$user['ativo'] === 0) {
                $error = 'Usuário inativo.';
            } else {
                $_SESSION['user'] = [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'nome' => $user['nome'],
                    'email' => $user['email'],
                    'nivel_acesso' => $user['nivel_acesso']
                ];
                header('Location: index.php');
                exit;
            }
        } else {
            $error = 'Usuário ou senha inválidos.';
        }
    }
}
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login - Gestão</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f5f7fb; margin:0; }
    .center { min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { width: 360px; background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.08); padding:28px; }
    h1 { margin:0 0 16px; font-size:22px; color:#111827; }
    p { margin:0 0 16px; color:#6b7280; font-size:14px; }
    .field { margin-bottom:14px; }
    label { display:block; margin-bottom:6px; font-weight:600; color:#374151; font-size:13px; }
    input[type=text], input[type=password] { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:14px; outline:none; transition:.2s; }
    input[type=text]:focus, input[type=password]:focus { border-color:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,.12); }
    .btn { width:100%; padding:10px 12px; background:#3b82f6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; margin-top:8px; }
    .btn:hover { background:#2563eb; }
    .error { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; padding:10px; border-radius:8px; margin-bottom:10px; font-size:13px; }
    .footer { margin-top:10px; text-align:center; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <div class="center">
    <form class="card" method="post" action="login.php" autocomplete="on">
      <h1>Entrar</h1>
      <p>Acesse sua conta</p>
      <?php if ($error): ?>
        <div class="error"><?php echo htmlspecialchars($error); ?></div>
      <?php endif; ?>
      <div class="field">
        <label for="username">Usuário</label>
        <input id="username" name="username" type="text" required autofocus />
      </div>
      <div class="field">
        <label for="password">Senha</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button class="btn" type="submit">Entrar</button>
      <div class="footer">Use seu usuário cadastrado no sistema</div>
      <div class="footer" style="margin-top:6px;">
        Não tem conta? <a href="register.php">Cadastre-se</a>
      </div>
    </form>
  </div>
</body>
</html>
