<?php

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function requestBody(): array
{
    $content = file_get_contents('php://input');
    if ($content === false || $content === '') {
        return [];
    }

    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [];
}

function ensureServiceToken(string $expectedToken): bool
{
    $providedToken = $_SERVER['HTTP_X_SERVICE_TOKEN'] ?? '';
    if ($providedToken !== $expectedToken) {
        jsonResponse(['message' => 'Não autorizado.'], 401);
        return false;
    }

    return true;
}