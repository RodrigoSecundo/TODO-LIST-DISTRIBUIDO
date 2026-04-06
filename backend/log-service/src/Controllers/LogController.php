<?php

namespace App\Controllers;

use App\Models\LogEntry;

class LogController
{
    public function index(): void
    {
        $logs = LogEntry::query()
            ->orderByDesc('id')
            ->limit(100)
            ->get(['id', 'acao', 'detalhe', 'usuario_id', 'created_at'])
            ->map(fn (LogEntry $log) => [
                'id' => $log->id,
                'acao' => $log->acao,
                'detalhe' => $log->detalhe,
                'usuarioId' => $log->usuario_id,
                'timestamp' => $log->created_at?->toISOString()
            ]);

        jsonResponse($logs->all());
    }

    public function store(array $payload): void
    {
        $action = trim((string) ($payload['action'] ?? ''));
        $detail = trim((string) ($payload['detail'] ?? ''));

        if ($action === '' || $detail === '') {
            jsonResponse(['message' => 'Campos action e detail são obrigatórios.'], 422);
            return;
        }

        $log = LogEntry::query()->create([
            'acao' => $action,
            'detalhe' => $detail,
            'usuario_id' => isset($payload['usuarioId']) ? (int) $payload['usuarioId'] : null
        ]);

        jsonResponse([
            'id' => $log->id,
            'acao' => $log->acao,
            'detalhe' => $log->detalhe,
            'usuarioId' => $log->usuario_id,
            'timestamp' => $log->created_at?->toISOString()
        ], 201);
    }
}