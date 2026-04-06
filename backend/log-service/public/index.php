<?php

use App\Controllers\LogController;

$config = require dirname(__DIR__) . '/src/Support/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

header('Access-Control-Allow-Origin: ' . $config['frontendOrigin']);
header('Access-Control-Allow-Headers: Content-Type, X-Service-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$controller = new LogController();

try {
    if ($method === 'GET' && $path === '/health') {
        jsonResponse(['service' => 'log-service', 'status' => 'ok']);
        return;
    }

    if ($method === 'GET' && $path === '/api/logs') {
        $controller->index();
        return;
    }

    if ($method === 'POST' && $path === '/api/logs') {
        if (!ensureServiceToken($config['serviceToken'])) {
            return;
        }

        $controller->store(requestBody());
        return;
    }

    jsonResponse(['message' => 'Rota não encontrada.'], 404);
} catch (Throwable $exception) {
    jsonResponse([
        'message' => 'Erro interno do servidor.',
        'error' => $exception->getMessage()
    ], 500);
}