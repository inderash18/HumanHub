import axios from "axios"

const api = axios.create({
  // In Docker: VITE_API_URL=http://localhost/api (nginx → backend at /api/*)
  // Locally: set in .env as VITE_API_URL=http://localhost/api
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost/api',
  withCredentials: true
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(err)
    return Promise.reject(err)
  }
)

export default api