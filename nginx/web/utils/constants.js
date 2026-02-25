// config.ts or backend.ts
const ENV = process.env.NODE_ENV === "production" ? "production" : "development";

const BACKEND_URL =
  ENV === "production"
    ? "https://morequizbowl.com"      // your live backend
    : "http://localhost";    // local/dev backend

console.log("Running in", ENV, "backend:", BACKEND_URL);

export { BACKEND_URL, ENV };