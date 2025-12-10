import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearAuth,
} from "./auth.js";

// Config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// All backend routes are mounted under /api (see Flask blueprint in server/app/__init__.py)
// Previous implementation missed this prefix for clinical/admin endpoints causing 404 & CORS issues.
const ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  REFRESH: "/api/auth/refresh",
  PATIENTS: "/api/patients",
  EXAMS: "/api/exams",
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_USERS: "/api/admin/users",
};

// Axios instance dengan interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor untuk menambahkan auth header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor untuk handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("Refresh token not found");
        }

        const response = await axios.post(
          `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { access_token } = response.data;
        updateAccessToken(access_token);

        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth functions
export const getToken = () => getAccessToken();

// Create patient (non-PII metadata)
export async function createPatient(data) {
  const res = await apiClient.post(ENDPOINTS.PATIENTS, data);
  return res.data;
}

// Create exam untuk patient tertentu
export async function createExam(patientId) {
  const res = await apiClient.post(ENDPOINTS.EXAMS, { patient_id: patientId });
  return res.data;
}

// Upload retina image ke exam tertentu (multipart/form-data)
export async function uploadExamImage(examId, file, eyeSide = "unknown") {
  const form = new FormData();
  form.append("file", file);
  form.append("eye_side", eyeSide);

  console.log("Uploading image with data:", {
    examId,
    fileName: file.name,
    fileSize: file.size,
    eyeSide,
  });

  try {
    const res = await apiClient.post(
      `${ENDPOINTS.EXAMS}/${examId}/images`,
      form,
      {
        
        timeout: 60000, // 60 seconds for file upload
      }
    );
    console.log("Upload response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Upload error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Trigger analisis AI untuk exam
export async function startExamAnalysis(examId) {
  const res = await apiClient.post(`${ENDPOINTS.EXAMS}/${examId}/analyze`, {});
  return res.data;
}

// Ambil detail exam (beserta patient, images, outputs)
export async function getExam(examId) {
  const res = await apiClient.get(`${ENDPOINTS.EXAMS}/${examId}`);
  return res.data;
}

// List notes for an exam (doctor/operator)
export async function listExamNotes(examId) {
  const res = await apiClient.get(`${ENDPOINTS.EXAMS}/${examId}/notes`);
  return res.data;
}

// Create a new note (doctor only)
export async function createExamNote(examId, content) {
  const res = await apiClient.post(`${ENDPOINTS.EXAMS}/${examId}/notes`, {
    content,
  });
  return res.data;
}

// List riwayat exams dengan filter & pagination
export async function listExams(params = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const res = await apiClient.get(
    `${ENDPOINTS.EXAMS}?${queryParams.toString()}`
  );
  return res.data;
}

export async function adminStats() {
  const res = await apiClient.get(ENDPOINTS.ADMIN_STATS);
  return res.data;
}

export async function listUsers() {
  const res = await apiClient.get(ENDPOINTS.ADMIN_USERS);
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await apiClient.put(`${ENDPOINTS.ADMIN_USERS}/${userId}/role`, {
    role,
  });
  return res.data;
}

// Verifikasi exam (doctor/admin)
export async function verifyExam(examId) {
  const res = await apiClient.post(`${ENDPOINTS.EXAMS}/${examId}/verify`);
  return res.data;
}

// Fetch PDF blob (inline preview)
export async function fetchExamPdfBlob(examId) {
  const response = await apiClient.get(
    `${ENDPOINTS.EXAMS}/${examId}/pdf?inline=1`,
    {
      responseType: "blob",
    }
  );
  return response.data; // Blob
}

// Trigger direct download (fallback button)
export async function downloadExamPdf(examId) {
  const blob = await fetchExamPdfBlob(examId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `exam_${examId}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default apiClient;
