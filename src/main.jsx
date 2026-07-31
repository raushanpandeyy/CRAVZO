import React from "react";
import ReactDOM from 'react-dom/client';
import { HashRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from './App.jsx';
import { queryClient } from "./services/queryClient.js";

const clearLegacyRuntimeCaches = async () => {
  if (!("caches" in window)) return;
  await Promise.allSettled([
    caches.delete("api-cache"),
    caches.delete("workbox-runtime-api-cache"),
  ]);
};

clearLegacyRuntimeCaches().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HashRouter>
  );
});
