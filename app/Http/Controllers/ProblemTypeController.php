<?php

namespace App\Http\Controllers;

use App\Models\ProblemType;

class ProblemTypeController extends Controller
{
    public function index()
    {
        return response()->json(ProblemType::all());
    }
}