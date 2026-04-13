import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Check 1-week expiration for "Remember Me"
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    if (loginTimestamp) {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(loginTimestamp) > oneWeek) {
            localStorage.clear();
            sessionStorage.clear();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return config;
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}token/refresh/`, {
                        refresh: refreshToken,
                    });
                    const { access } = response.data;

                    if (localStorage.getItem('token')) {
                        localStorage.setItem('token', access);
                    } else {
                        sessionStorage.setItem('token', access);
                    }

                    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed', refreshError);
                    localStorage.clear();
                    sessionStorage.clear();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                localStorage.clear();
                sessionStorage.clear();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('token/', credentials);
        return response.data;
    },
    signUp: async (data: any) => {
        const response = await api.post('register/', data);
        return response.data;
    },
    resetPassword: async (data: any) => {
        const response = await api.post('password-reset/', data);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('users/me/');
        return response.data;
    },
    updateProfile: async (data: FormData) => {
        const response = await api.patch('users/me/', data);
        return response.data;
    },
    getUsers: async () => {
        const response = await api.get('users/');
        return response.data;
    },
    createStaff: async (data: any) => {
        const response = await api.post('users/', data);
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.post('users/change-password/', data);
        return response.data;
    },
    deleteUser: async (id: number | string) => {
        const response = await api.delete(`users/${id}/`);
        return response.data;
    },
    updateUser: async (id: number | string, data: any) => {
        const response = await api.patch(`users/${id}/`, data);
        return response.data;
    },
};

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get('notifications/');
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await api.post(`notifications/${id}/mark-read/`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.post('notifications/mark-all-read/');
        return response.data;
    },
    deleteAllNotifications: async () => {
        const response = await api.post('notifications/delete-all/');
        return response.data;
    },
    deleteNotification: async (id: number) => {
        const response = await api.delete(`notifications/${id}/`);
        return response.data;
    },
};

export const schoolService = {
    getSchoolYears: () => api.get('school-years/'),
    getClasses: () => api.get('classes/'),
    getStudents: () => api.get('students/'),
    createStudent: (data: any) => api.post('students/', data),
    updateStudent: (id: string, data: any) => api.put(`students/${id}/`, data),
    deleteStudent: (id: string) => api.delete(`students/${id}/`),
    bulkPromoteStudents: (data: any[]) => api.post('students/bulk-promote/', data),
    createClass: (data: any) => api.post('classes/', data),
    updateClass: (id: string, data: any) => api.put(`classes/${id}/`, data),
    deleteClass: (id: string) => api.delete(`classes/${id}/`),
    getSubjects: () => api.get('subjects/'),
    getPeriods: () => api.get('periods/'),
    getGrades: () => api.get('grades/'),
    createGrade: (data: any) => api.post('grades/', data),
    bulkCreateGrades: (data: any[]) => api.post('grades/bulk-create/', data),
    getSettings: () => api.get('school/settings/'),
    updateSettings: (data: any) => {
        if (data instanceof FormData) {
            return api.patch('school/settings/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.patch('school/settings/', data);
    },
};

export const financeService = {
    getPayments: () => api.get('payments/'),
    getTranches: () => api.get('tranches/'),
    createPayment: (data: any) => api.post('payments/', data),
    updatePayment: (id: string, data: any) => api.put(`payments/${id}/`, data),
    deletePayment: (id: string) => api.delete(`payments/${id}/`),
    getPaymentSummary: (studentId: string) => api.get(`payments/summary/?student_id=${studentId}`),
    getNextReceiptNumber: () => api.get('payments/next-receipt/'),
    getExpenses: () => api.get('expenses/'),
    createExpense: (data: any) => api.post('expenses/', data),
    updateExpense: (id: string, data: any) => api.put(`expenses/${id}/`, data),
    deleteExpense: (id: string) => api.delete(`expenses/${id}/`),
    getTuitionTemplates: () => api.get('tuition-templates/'),
    updateTuitionTemplate: (id: number, data: any) => api.patch(`tuition-templates/${id}/`, data),
};

export const agendaService = {
    getEvents: () => api.get('events/'),
    createEvent: (data: any) => api.post('events/', data),
    updateEvent: (id: string, data: any) => api.put(`events/${id}/`, data),
    deleteEvent: (id: string) => api.delete(`events/${id}/`),
};

export const dashboardService = {
    getStats: () => api.get('dashboard/'),
};
