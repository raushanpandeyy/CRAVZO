import React from "react";
import ReactDOM from 'react-dom/client';
import { HashRouter } from "react-router-dom";
import App from './App.jsx';
// Fix 9: leaflet/dist/leaflet.css removed from here — moved to RiderMap.jsx
// so it only loads on pages that actually show a map (4KB saved on every other page)

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>


);
