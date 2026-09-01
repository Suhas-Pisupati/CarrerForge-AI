import axios from "axios";

const API = (
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

console.log("Backend API:", API);


// ========================================
// AUTHENTICATION
// ========================================

// Register
export const registerUser = async (data) => {
  try {
    const response = await axios.post(
      `${API}/auth/register`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Registration Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// Login
export const loginUser = async (data) => {
  try {
    const response = await axios.post(
      `${API}/auth/login`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Login Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// RESUME ANALYSIS
// ========================================

export const analyzeResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  try {
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

  } catch (error) {
    console.error(
      "Resume Analysis Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// INTERVIEW CHAT
// ========================================

export const interviewChat = async (data) => {
  try {
    const response = await axios.post(
      `${API}/interview-chat`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Interview Chat Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// JOB CHAT
// ========================================

export const jobChat = async (data) => {
  try {
    const response = await axios.post(
      `${API}/job-chat`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Job Chat Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// MOCK INTERVIEW
// ========================================

export const startMockInterview = async (data) => {
  try {
    const response = await axios.post(
      `${API}/mock/start`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Start Mock Interview Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


export const evaluateMockInterview = async (data) => {
  try {
    const response = await axios.post(
      `${API}/mock/evaluate`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Evaluate Mock Interview Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// CODING
// ========================================

export const getCodingQuestions = async (data) => {
  try {
    const response = await axios.post(
      `${API}/coding/questions`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Coding Questions Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


export const runCoding = async (data) => {
  try {
    const response = await axios.post(
      `${API}/coding/run`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Run Coding Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


export const evaluateCoding = async (data) => {
  try {
    const response = await axios.post(
      `${API}/coding/evaluate`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Evaluate Coding Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// PROJECTS
// ========================================

export const getProjects = async () => {
  try {
    const response = await axios.get(
      `${API}/projects`
    );

    return response.data;

  } catch (error) {
    console.error(
      "Projects Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// PROJECT GUIDE
// ========================================

export const getProjectGuide = async (data) => {
  try {
    const response = await axios.post(
      `${API}/project-guide`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Project Guide Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ========================================
// EXPORT API URL
// ========================================

export default API;