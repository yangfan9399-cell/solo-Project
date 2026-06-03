// @refresh reload
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import Nav from "./components/Nav";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div class="min-h-screen bg-gray-50">
          <Nav />
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>}>
              {props.children}
            </Suspense>
          </main>
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
