export const BASE = "http://localhost:5000/api";

export let authToken = process.env.AUTH_TOKEN || "";

export const PORT = 5173;

export function setAuthToken(token) {
    authToken = token;
}
