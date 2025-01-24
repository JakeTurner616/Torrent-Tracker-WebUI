import axios from "axios";

// Use environment variables for production
const apiBaseUrl = process.env.EXPRESS_APP_API_BASE_URL || "http://localhost:3005";
const authToken = process.env.REACT_APP_AUTH_TOKEN || "your-secret-token-for-authentication";

const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
});

axiosInstance.interceptors.request.use(
    (axiosConfig) => {
        if (!axiosConfig.headers.Authorization) {
            axiosConfig.headers["Authorization"] = `Bearer ${authToken}`;
        }
        return axiosConfig;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
