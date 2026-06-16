@extends('layouts.app')

@section('title', '登录')

@section('content')
<div style="max-width: 400px; margin: 3rem auto;">
    <div class="card">
        <h2 class="card-title">🔐 账号登录</h2>
        <form method="POST" action="{{ route('login') }}">
            @csrf
            <div class="form-group">
                <label>邮箱地址</label>
                <input type="email" name="email" class="form-control" value="{{ old('email') }}" required autofocus>
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="remember">
                    <span>记住我</span>
                </label>
            </div>
            <button type="submit" class="btn btn-primary w-full">登录</button>
        </form>
        <div class="mt-4 text-center text-sm">
            还没有账号？<a href="{{ route('register') }}">立即注册</a>
        </div>
    </div>
</div>
@endsection
