import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

export default apiClient;

// GET /documents -> Document[]
export async function fetchDocuments() {
  const res = await apiClient.get('/documents');
  return res.data;
}

// POST /upload (multipart/form-data) -> { document, ragResponse? , warning? }
export async function uploadDocument(formData) {
  const res = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// POST /chat { query, filters } -> { answer, citations }
export async function sendChatQuery(query, filters) {
  const res = await apiClient.post('/chat', { query, filters });
  return res.data;
}
