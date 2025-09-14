<?php
require_once __DIR__ . '/config.php';
session_start();

// Se já estiver logado, redireciona para home
if (!empty($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $confirm = trim($_POST['confirm'] ?? '');
    $nivel = trim($_POST['nivel'] ?? 'visualizacao'); // admin, manutencao, visualizacao

    if ($username === '' || $nome === '' || $password === '' || $confirm === '') {
        $error = 'Preencha todos os campos obrigatórios.';
    } elseif ($password !== $confirm) {
        $error = 'As senhas não conferem.';
    } elseif (strlen($username) < 3) {
        $error = 'Usuário deve ter pelo menos 3 caracteres.';
    } elseif (strlen($password) < 4) {
        $error = 'Senha deve ter pelo menos 4 caracteres.';
    } else {
        // Verifica se já existe
        $check = $pdo->prepare('SELECT id FROM usuarios WHERE username = :u');
        $check->execute([':u' => $username]);
        if ($check->fetch()) {
            $error = 'Usuário já existe.';
        } else {
            $stmt = $pdo->prepare('INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo) VALUES (:u, :p, :n, :e, :nv, 1)');
            try {
                $stmt->execute([
                    ':u' => $username,
                    ':p' => hash_password($password),
                    ':n' => $nome,
                    ':e' => $email !== '' ? $email : null,
                    ':nv' => in_array($nivel, ['admin','manutencao','visualizacao'], true) ? $nivel : 'visualizacao',
                ]);
                $success = 'Usuário cadastrado com sucesso. Você já pode fazer login.';
            } catch (PDOException $e) {
                $error = 'Erro ao salvar: ' . htmlspecialchars($e->getMessage());
            }
        }
    }
}
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cadastrar Usuário - Gestão</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f5f7fb; margin:0; }
    .center { min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { width: 420px; background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.08); padding:28px; }
    h1 { margin:0 0 16px; font-size:22px; color:#111827; }
    p { margin:0 0 16px; color:#6b7280; font-size:14px; }
    .field { margin-bottom:12px; }
    label { display:block; margin-bottom:6px; font-weight:600; color:#374151; font-size:13px; }
    input[type=text], input[type=password], input[type=email], select { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:14px; outline:none; transition:.2s; }
    input:focus, select:focus { border-color:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,.15); }
    .btn { width:100%; padding:10px 12px; background:#10b981; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; margin-top:8px; }
    .btn:hover { background:#059669; }
    .error { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; padding:10px; border-radius:8px; margin-bottom:10px; font-size:13px; }
    .ok { background:#dcfce7; color:#065f46; border:1px solid #bbf7d0; padding:10px; border-radius:8px; margin-bottom:10px; font-size:13px; }
    .link { display:block; text-align:center; margin-top:10px; font-size:13px; color:#2563eb; text-decoration:none; }
    .link:hover { text-decoration:underline; }
  </style>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline';">
</head>
<body>
  <div class="center">
    <form class="card" method="post" action="register.php" autocomplete="off">
      <h1>Cadastrar Usuário</h1>
      <p>Crie um novo acesso ao sistema</p>
      <?php if ($error): ?>
        <div class="error"><?php echo htmlspecialchars($error); ?></div>
      <?php elseif ($success): ?>
        <div class="ok"><?php echo htmlspecialchars($success); ?></div>
      <?php endif; ?>
      <div class="field">
        <label for="username">Usuário *</label>
        <input id="username" name="username" type="text" required />
      </div>
      <div class="field">
        <label for="nome">Nome *</label>
        <input id="nome" name="nome" type="text" required />
      </div>
      <div class="field">
        <label for="email">E-mail</label>
        <input id="email" name="email" type="email" />
      </div>
      <div class="field">
        <label for="nivel">Nível de acesso</label>
        <select id="nivel" name="nivel">
          <option value="visualizacao">Visualização</option>
          <option value="manutencao">Manutenção</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="field">
        <label for="password">Senha *</label>
        <input id="password" name="password" type="password" required />
      </div>
      <div class="field">
        <label for="confirm">Confirmar Senha *</label>
        <input id="confirm" name="confirm" type="password" required />
      </div>
      <button class="btn" type="submit">Cadastrar</button>
      <a class="link" href="login.php">Já tem conta? Entrar</a>
    </form>
  </div>
  <!-- Dica: para testes, crie um usuário admin/admin e depois remova ou altere a senha -->
  
  
  
  
</body>
</html>
