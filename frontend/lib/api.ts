import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          await api.post("/auth/api/refresh");
        } catch (err) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
