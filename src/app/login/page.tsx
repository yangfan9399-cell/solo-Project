import { Suspense } from "react";
import LoginPage from "./LoginPage";

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-customs-800 flex items-center justify-center">
      <div className="text-white">加载中...</div>
    </div>}>
      <LoginPage />
    </Suspense>
  );
}
