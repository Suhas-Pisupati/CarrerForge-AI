import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Analyze Resume
export const analyzeResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API}/analyze`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// Interview Chat
export const interviewChat = async (data) => {
  const response = await axios.post(
    `${API}/interview-chat`,
    data
  );

  return response.data;
};

// Job Chat
export const jobChat = async (data) => {
  const response = await axios.post(
    `${API}/job-chat`,
    data
  );

  return response.data;
};

// Start Mock Interview
export const startMockInterview = async (data) => {
  const response = await axios.post(
    `${API}/mock/start`,
    data
  );

  return response.data;
};

// Evaluate Mock Interview
export const evaluateMockInterview = async (data) => {
  const response = await axios.post(
    `${API}/mock/evaluate`,
    data
  );

  return response.data;
};

// Get Coding Questions
export const getCodingQuestions = async (data) => {
  const response = await axios.post(
    `${API}/coding/questions`,
    data
  );

  return response.data;
};

// Run Coding Problem
export const runCoding = async (data) => {
  const response = await axios.post(
    `${API}/coding/run`,
    data
  );

  return response.data;
};

// Evaluate Coding Problem
export const evaluateCoding = async (data) => {
  const response = await axios.post(
    `${API}/coding/evaluate`,
    data
  );

  return response.data;
};

// Get Projects
export const getProjects = async () => {
  const response = await axios.get(
    `${API}/projects`
  );

  return response.data;
};

// Get Project Guide
export const getProjectGuide = async (data) => {
  const response = await axios.post(
    `${API}/project-guide`,
    data
  );

  return response.data;
};

// Export API base URL
export default API;
