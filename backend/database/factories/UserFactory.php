<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'pseudo' => fake()->unique()->userName(),
            'telephone_contact' => fake()->phoneNumber(),
            'role' => 'enseignant',
            'actif' => true,
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
}