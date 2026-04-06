<?php

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;

require dirname(__DIR__, 2) . '/vendor/autoload.php';
require __DIR__ . '/helpers.php';

$rootPath = dirname(__DIR__, 2);

if (file_exists($rootPath . '/.env')) {
    Dotenv::createImmutable($rootPath)->safeLoad();
}

$databasePath = $rootPath . '/' . ($_ENV['DB_DATABASE'] ?? 'database/logs.sqlite');
$databaseDir = dirname($databasePath);

if (!is_dir($databaseDir)) {
    mkdir($databaseDir, 0777, true);
}

if (!file_exists($databasePath)) {
    touch($databasePath);
}

$capsule = new Capsule();
$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => $databasePath,
    'prefix' => ''
]);

$capsule->setEventDispatcher(new Dispatcher(new Container()));
$capsule->setAsGlobal();
$capsule->bootEloquent();

$schema = $capsule->schema();

if (!$schema->hasTable('logs')) {
    $schema->create('logs', function ($table) {
        $table->id();
        $table->string('acao');
        $table->text('detalhe');
        $table->unsignedBigInteger('usuario_id')->nullable();
        $table->timestamps();
    });
}

return [
    'serviceToken' => $_ENV['SERVICE_TOKEN'] ?? 'internal-log-token',
    'frontendOrigin' => $_ENV['FRONTEND_ORIGIN'] ?? 'http://127.0.0.1:5500'
];