import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Axios Request Interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Client Wrapper Methods
export const apiService = {
  // --- AUTH ---
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  seedDatabase: async () => {
    const response = await api.post('/seed');
    return response.data;
  },

  // --- ADMIN ---
  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get('/admin/departments');
    return response.data;
  },
  createDepartment: async (dept: any) => {
    const response = await api.post('/admin/departments', dept);
    return response.data;
  },
  deleteDepartment: async (id: number) => {
    const response = await api.delete(`/admin/departments/${id}`);
    return response.data;
  },
  getSubjects: async () => {
    const response = await api.get('/admin/subjects');
    return response.data;
  },
  createSubject: async (sub: any) => {
    const response = await api.post('/admin/subjects', sub);
    return response.data;
  },
  deleteSubject: async (id: number) => {
    const response = await api.delete(`/admin/subjects/${id}`);
    return response.data;
  },
  getClasses: async () => {
    const response = await api.get('/admin/classes');
    return response.data;
  },
  createClass: async (cls: any) => {
    const response = await api.post('/admin/classes', cls);
    return response.data;
  },
  deleteClass: async (id: number) => {
    const response = await api.delete(`/admin/classes/${id}`);
    return response.data;
  },
  getFaculty: async () => {
    const response = await api.get('/admin/faculty');
    return response.data;
  },
  createFaculty: async (fac: any) => {
    const response = await api.post('/admin/faculty', fac);
    return response.data;
  },
  deleteFaculty: async (id: number) => {
    const response = await api.delete(`/admin/faculty/${id}`);
    return response.data;
  },
  getStudents: async () => {
    const response = await api.get('/admin/students');
    return response.data;
  },
  createStudent: async (stud: any) => {
    const response = await api.post('/admin/students', stud);
    return response.data;
  },
  deleteStudent: async (id: number) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },
  getAssignments: async () => {
    const response = await api.get('/admin/faculty-assignments');
    return response.data;
  },
  createAssignment: async (assign: any) => {
    const response = await api.post('/admin/faculty-assignments', assign);
    return response.data;
  },
  deleteAssignment: async (id: number) => {
    const response = await api.delete(`/admin/faculty-assignments/${id}`);
    return response.data;
  },

  // --- FACULTY ---
  getFacultyDashboardStats: async () => {
    const response = await api.get('/faculty/dashboard-stats');
    return response.data;
  },
  getFacultySubjects: async () => {
    const response = await api.get('/faculty/my-subjects');
    return response.data;
  },
  getFacultyClasses: async () => {
    const response = await api.get('/faculty/my-classes');
    return response.data;
  },
  getFacultyExams: async () => {
    const response = await api.get('/faculty/exams');
    return response.data;
  },
  createExam: async (examData: any) => {
    const response = await api.post('/faculty/exams', examData);
    return response.data;
  },
  uploadAnswerSheets: async (examId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/faculty/exams/${examId}/upload-answer-sheets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getExamAnswerSheets: async (examId: number) => {
    const response = await api.get(`/faculty/exams/${examId}/answer-sheets`);
    return response.data;
  },
  getDetailedEvaluation: async (sheetId: number) => {
    const response = await api.get(`/faculty/answer-sheets/${sheetId}/evaluation`);
    return response.data;
  },
  overrideMarks: async (resultId: number, marks: number, feedback: string) => {
    const response = await api.put(`/faculty/evaluation/${resultId}/override`, {
      marks_obtained: marks,
      feedback,
    });
    return response.data;
  },
  approveAnswerSheet: async (sheetId: number, remarks: string) => {
    const response = await api.put(`/faculty/answer-sheets/${sheetId}/approve`, { remarks });
    return response.data;
  },
  publishResults: async (examId: number) => {
    const response = await api.put(`/faculty/exams/${examId}/publish`);
    return response.data;
  },
  getExamAnalytics: async (examId: number) => {
    const response = await api.get(`/faculty/exams/${examId}/analytics`);
    return response.data;
  },
  getFacultyComplaints: async () => {
    const response = await api.get('/faculty/complaints');
    return response.data;
  },
  resolveComplaint: async (id: number, status: 'resolved' | 'rejected' | 'in_progress', remarks: string) => {
    const response = await api.put(`/faculty/complaints/${id}`, {
      status,
      resolution_remarks: remarks,
    });
    return response.data;
  },

  // --- STUDENT ---
  getStudentDashboardStats: async () => {
    const response = await api.get('/student/dashboard-stats');
    return response.data;
  },
  getStudentExams: async () => {
    const response = await api.get('/student/exams');
    return response.data;
  },
  getStudentResultDetails: async (sheetId: number) => {
    const response = await api.get(`/student/results/${sheetId}`);
    return response.data;
  },
  raiseComplaint: async (sheetId: number, category: string, description: string) => {
    const response = await api.post('/student/complaints', {
      answer_sheet_id: sheetId,
      category,
      description,
    });
    return response.data;
  },
  getStudentComplaints: async () => {
    const response = await api.get('/student/complaints');
    return response.data;
  },
};

export default api;
