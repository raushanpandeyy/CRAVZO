import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiEndpoints.js";

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

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || "Request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!navigator.onLine) {
      throw new Error("No internet connection");
    }

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }

    throw new Error(error.message || "Network error");
  }
}




export { apiRequest };
