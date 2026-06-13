<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <div class="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                    奖学金评审系统
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    请登录以继续
                </p>
            </div>

            <div class="card p-8">
                <form @submit.prevent="submit" class="space-y-6">
                    <div v-if="errors.email" class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p class="text-sm text-red-600">{{ errors.email }}</p>
                    </div>

                    <div>
                        <label for="email" class="input-label">邮箱</label>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            class="input-field"
                            placeholder="请输入邮箱"
                            :class="{ 'border-red-300': errors.email }"
                        />
                    </div>

                    <div>
                        <label for="password" class="input-label">密码</label>
                        <input
                            id="password"
                            v-model="form.password"
                            type="password"
                            class="input-field"
                            placeholder="请输入密码"
                            :class="{ 'border-red-300': errors.password }"
                        />
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input
                                id="remember"
                                v-model="form.remember"
                                type="checkbox"
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label for="remember" class="ml-2 block text-sm text-gray-700">
                                记住我
                            </label>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            class="w-full btn-primary py-3"
                            :disabled="processing"
                        >
                            <span v-if="processing" class="flex items-center justify-center">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                登录中...
                            </span>
                            <span v-else>登 录</span>
                        </button>
                    </div>
                </form>

                <div class="mt-6 pt-6 border-t border-gray-200">
                    <p class="text-xs text-gray-500 text-center mb-2">测试账号</p>
                    <div class="text-xs text-gray-500 space-y-1">
                        <p>业务专员：business@example.com / password123</p>
                        <p>审批负责人：approval@example.com / password123</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useForm, usePage } from '@inertiajs/vue3';

const page = usePage();

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login.post'), {
        onSuccess: () => {
            // 登录成功后会自动跳转
        },
    });
};

const errors = page.props.errors || {};
const processing = form.processing;
</script>
