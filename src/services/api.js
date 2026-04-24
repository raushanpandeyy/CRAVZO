<<<<<<< HEAD
import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiEndpoints.js";
=======
import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiEndpoints";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const getStoredToken = () => localStorage.getItem("cravzoAuthToken");

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 🔥 Debug
console.log("BASE:", API_BASE_URL);
console.log("FINAL URL:", API_BASE_URL + API_ENDPOINTS.auth.login);

export { apiRequest };
