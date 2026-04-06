import { API_CONFIG, apiRequest } from "./api.js";

export function login(email, senha) {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, senha })
    });
}

export function register(nome, email, senha) {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ nome, email, senha })
    });
}

export function getTodos() {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/tasks`);
}

export function createTodo(data) {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/tasks`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function toggleTodo(id) {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/tasks/${id}/toggle`, {
        method: "PATCH"
    });
}

export function deleteTodo(id) {
    return apiRequest(`${API_CONFIG.TASK_SERVICE}/tasks/${id}`, {
        method: "DELETE"
    });
}

export function getStats() {
    return apiRequest(`${API_CONFIG.ANALYTICS_SERVICE}/stats`);
}