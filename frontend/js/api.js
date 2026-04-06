export const API_CONFIG = {
    LOG_SERVICE: "http://localhost:8000/api",
    TASK_SERVICE: "http://localhost:3001/api",
    ANALYTICS_SERVICE: "http://localhost:8001/api"
};

const TOKEN_KEY = "todo-token";
const USER_KEY = "todo-user";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    const rawValue = localStorage.getItem(USER_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
}

export function saveSession(session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export async function apiRequest(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message || "Erro ao processar a solicitação.");
    }

    return payload;
}