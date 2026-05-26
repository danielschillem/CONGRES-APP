<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gestion.bf'],
            [
                'civilite' => 'M.',
                'nom' => 'Admin',
                'prenom' => 'Gestion',
                'sexe' => 'M',
                'telephone' => '70000000',
                'password' => Hash::make('password123'),
            ]
        )->forceFill([
            'role' => 'admin',
            'email_verified_at' => now(),
        ])->save();
    }
}
