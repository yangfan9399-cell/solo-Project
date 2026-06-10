<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProblemTypesSeeder::class,
            UsersSeeder::class,
            StoresSeeder::class,
            IssuesSeeder::class,
        ]);
    }
}