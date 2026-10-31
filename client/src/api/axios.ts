import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
});

// request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && !config.headers["Authorization"]) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            !error.response ||
            error.response.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes("/api/auth/login") ||
            originalRequest.url?.includes("/api/auth/register") ||
            originalRequest.url?.includes("/api/auth/refresh")
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers["Authorization"] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            isRefreshing = false;
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            delete api.defaults.headers.common["Authorization"];
            window.dispatchEvent(new Event("auth:logout"));
            return Promise.reject(error);
        }

        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
            const { data } = await axios.post(`${baseURL}/api/auth/refresh`, {
                refreshToken,
            });

            const newToken = data.token;
            const newRefreshToken = data.refreshToken;

            localStorage.setItem("token", newToken);
            if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
            }
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

            processQueue(null, newToken);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            delete api.defaults.headers.common["Authorization"];
            window.dispatchEvent(new Event("auth:logout"));
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;