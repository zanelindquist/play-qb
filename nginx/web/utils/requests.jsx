import axios from "axios"
import { getAccessToken } from "./encryption.js"
import { RedirectToSignIn } from "./redirects.jsx"

const api = axios.create({baseURL: "https://app.localhost/api/v1"})
const auth = axios.create({baseURL: "https://app.localhost/auth"})

// ===== MISC =====
function handleNoAccessToken() {
    if (!showAlert || !router) throw new Error("handleExpiredAccessToken(): function showAlert or router is not defined")
    showAlert("Access token not found. Please sign in.")
    router.push("/signin")

    // If we are on development, this is normal since we can't make API calls
    if(process.env.NODE_ENV === 'development') return
    // But if we aren't then we want to redirect them to login
    return <RedirectToSignIn></RedirectToSignIn>
}

function handleExpiredAccessToken(showAlert, router) {
    if (!showAlert || !router) throw new Error("handleExpiredAccessToken(): function showAlert or router is not defined")
    showAlert("Session expired. Please sign in again.")
    router.push("/signin")
}

function handleGeneralRequestError(error) {
    if (error.response && error.response.status === 401 && error.response.data.msg === "Token has expired") {
        throw new Error("Access token has expired.")
    } else {
        throw error
    }
}

function handleServerRequestError(error, showAlert) {
    if(error?.response?.data?.error) showAlert(error?.response?.data?.error)
    else showAlert("" + error)
}


// ===== HELPER FUNCTIONS =====
async function getProtectedRoute(route) {
    const token = await getAccessToken()
    if (!token) return handleNoAccessToken()
    
    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    try {
        return await api.get(route, {headers: headers})
    }catch (error) {
        throw handleGeneralRequestError(error)
    }
}

async function postProtectedRoute(route, data) {
    const token = await getAccessToken()
    if (!token) return handleNoAccessToken()

    try {
        return await api.post(route, data, {headers: {Authorization: `Bearer ${token}`}})
    }catch (error) {
        throw handleGeneralRequestError(error)
    }
}

async function putProtectedRoute(route, data) {
    const token = await getAccessToken()
    if (!token) return handleNoAccessToken()

    try {
    return await api.put(route, data, {headers: {Authorization: `Bearer ${token}`}})
    }catch (error) {
        throw handleGeneralRequestError(error)
    }
}

async function deleteProtectedRoute(route) {
    const token = await getAccessToken()
    if (!token) return handleNoAccessToken()

    try {
        return await api.delete(route, {headers: {Authorization: `Bearer ${token}`}})
    }catch (error) {
        throw handleGeneralRequestError(error)
    }
}


// ===== AUTH ROUTES =====

async function signUp(data) {
    return await auth.post("/register", data)
}

async function signIn(email, password) {
    return await auth.post("/login", {email: email, password: password})
}

async function validateEmail(email) {
    return await auth.post("/email", {email: email})
}

async function permissions(org_hash) {
    const token = await getAccessToken()
    if (!token) throw new Error("No access token found.")

    return await auth.post("/permissions", {org: org_hash}, {headers: {Authorization: `Bearer ${token}`}})
}


module.exports = { signUp, handleServerRequestError, signIn, validateEmail, getProtectedRoute, postProtectedRoute, putProtectedRoute, deleteProtectedRoute, handleExpiredAccessToken, permissions }