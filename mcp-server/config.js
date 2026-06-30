export const BASE = "http://localhost:5000/api";

export let authToken = process.env.AUTH_TOKEN || "";

export function setAuthToken(token) {
    authToken = token;
}
