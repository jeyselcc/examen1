<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $datos = [
        'codigo' => 'EQ-9876',
        'nombre' => 'Laptop de prueba',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno' => 250000,
    ];

    $respuesta = $this->postJson('/api/equipos', $datos);

    $respuesta->assertStatus(201);
    $respuesta->assertHeader('Location');
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $datos = [
        'codigo' => 'INCORRECTO',
        'nombre' => 'AB',
        'categoria_id' => 999999,
        'estado' => 'prestado',
        'fecha_adquisicion' => '2099-01-01',
        'costo_interno' => -100,
    ];

    $respuesta = $this->postJson('/api/equipos', $datos);
    $respuesta->assertStatus(422);
    $respuesta->assertJsonValidationErrors([ 'codigo', 'nombre', 'categoria_id', 'estado', 'fecha_adquisicion',
        'costo_interno',
    ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();
    $respuesta = $this->deleteJson("/api/equipos/{$equipo->id}");
    $respuesta->assertStatus(409);
    $respuesta->assertJsonPath(
        'mensaje',
        'No se puede eliminar un equipo prestado.'
    );

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
        'estado' => 'prestado',
    ]);
});
