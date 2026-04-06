import {
    login,
    register,
    getTodos,
    createTodo,
    toggleTodo,
    deleteTodo,
    getStats
} from "./todoService.js";
import { clearSession, getUser, saveSession } from "./api.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const form = document.getElementById("todoForm");
const todoList = document.getElementById("todoList");
const totalSpan = document.getElementById("total");
const completedSpan = document.getElementById("completed");
const pendingSpan = document.getElementById("pending");
const authMessage = document.getElementById("authMessage");
const todoMessage = document.getElementById("todoMessage");
const todoSection = document.getElementById("todoSection");
const userPanel = document.getElementById("userPanel");
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const showLogin = document.getElementById("showLogin");
const showRegister = document.getElementById("showRegister");

function setMessage(element, message, type = "info") {
    element.textContent = message;
    element.dataset.type = type;
}

function clearMessage(element) {
    element.textContent = "";
    element.dataset.type = "";
}

function toggleAuthMode(mode) {
    const isLogin = mode === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    showLogin.classList.toggle("active", isLogin);
    showRegister.classList.toggle("active", !isLogin);
    clearMessage(authMessage);
}

function updateSessionUI() {
    const user = getUser();
    const isAuthenticated = Boolean(user);

    todoSection.classList.toggle("hidden", !isAuthenticated);
    userPanel.classList.toggle("hidden", !isAuthenticated);

    if (user) {
        userName.textContent = `${user.nome} (${user.email})`;
    } else {
        userName.textContent = "";
        todoList.innerHTML = "";
        totalSpan.textContent = "0";
        completedSpan.textContent = "0";
        pendingSpan.textContent = "0";
    }
}

async function renderTodos() {
    const todos = await getTodos();
    todoList.innerHTML = "";

    if (!todos.length) {
        const li = document.createElement("li");
        li.className = "empty-state";
        li.textContent = "Nenhuma tarefa cadastrada para este usuário.";
        todoList.appendChild(li);
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement("li");
        if (todo.concluida) li.classList.add("completed");

        li.innerHTML = `
            <div>
                <strong>${todo.titulo}</strong>
                <p>${todo.descricao || "Sem descrição."}</p>
            </div>
            <div class="actions">
                <button class="btn-complete">✔</button>
                <button class="btn-delete">✖</button>
            </div>
        `;

        li.querySelector(".btn-complete")
            .addEventListener("click", async () => {
                await toggleTodo(todo.id);
                refresh();
            });

        li.querySelector(".btn-delete")
            .addEventListener("click", async () => {
                await deleteTodo(todo.id);
                refresh();
            });

        todoList.appendChild(li);
    });
}

async function renderStats() {
    const stats = await getStats();
    totalSpan.textContent = stats.total;
    completedSpan.textContent = stats.concluidas;
    pendingSpan.textContent = stats.pendentes;
}

async function refresh() {
    try {
        clearMessage(todoMessage);
        await renderTodos();
        await renderStats();
    } catch (error) {
        if (error.message.toLowerCase().includes("token")) {
            clearSession();
            updateSessionUI();
        }

        setMessage(todoMessage, error.message, "error");
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const session = await login(
            document.getElementById("loginEmail").value,
            document.getElementById("loginPassword").value
        );

        saveSession(session);
        loginForm.reset();
        clearMessage(authMessage);
        updateSessionUI();
        await refresh();
    } catch (error) {
        setMessage(authMessage, error.message, "error");
    }
});

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const session = await register(
            document.getElementById("registerName").value,
            document.getElementById("registerEmail").value,
            document.getElementById("registerPassword").value
        );

        saveSession(session);
        registerForm.reset();
        clearMessage(authMessage);
        updateSessionUI();
        await refresh();
    } catch (error) {
        setMessage(authMessage, error.message, "error");
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const titulo = document.getElementById("title").value.trim();
        const descricao = document.getElementById("description").value.trim();

        await createTodo({ titulo, descricao });

        form.reset();
        await refresh();
    } catch (error) {
        setMessage(todoMessage, error.message, "error");
    }
});

logoutButton.addEventListener("click", () => {
    clearSession();
    updateSessionUI();
    clearMessage(todoMessage);
    setMessage(authMessage, "Sessão encerrada.");
});

showLogin.addEventListener("click", () => toggleAuthMode("login"));
showRegister.addEventListener("click", () => toggleAuthMode("register"));

toggleAuthMode("login");
updateSessionUI();

if (getUser()) {
    refresh();
}