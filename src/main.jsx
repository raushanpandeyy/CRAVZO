import React from "react";
import ReactDOM from 'react-dom/client';
import { HashRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from './App.jsx';
import { queryClient } from "./services/queryClient.js";

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </HashRouter>
);
