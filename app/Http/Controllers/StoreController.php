<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $query = Store::with(['manager', 'regionManager']);

        if ($request->has('region')) {
            $query->where('region', $request->region);
        }

        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $store = Store::with(['manager', 'regionManager'])->findOrFail($id);
        return response()->json($store);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:stores',
            'region' => 'required|string',
            'address' => 'required|string',
            'level' => 'required|string',
        ]);

        $store = Store::create($request->all());
        return response()->json($store, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'string',
            'code' => 'string|unique:stores,code,' . $id,
            'region' => 'string',
            'address' => 'string',
            'level' => 'string',
        ]);

        $store = Store::findOrFail($id);
        $store->update($request->all());
        return response()->json($store);
    }

    public function destroy($id)
    {
        $store = Store::findOrFail($id);
        $store->delete();
        return response()->json(null, 204);
    }
}