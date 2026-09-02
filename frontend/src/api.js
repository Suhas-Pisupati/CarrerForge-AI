import axios from "axios";

// ==========================================================
// BACKEND API URL
// ==========================================================

const API =
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";

console.log("CareerForge AI API:", API);


// ==========================================================
// AUTHENTICATION
// ==========================================================

// Register
export const registerUser = async (data) => {
  try {
    const response = await axios.post(
      `${API}/auth/register`,
      {
        // Backend expects "name"
        name: data.name,
        email: data.email,
        password: data.password,
      }
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


// Get current logged-in user
export const getCurrentUser = async (token) => {
  try {

    const response = await axios.get(
      `${API}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;

  } catch (error) {

    console.error(
      "Current User Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==========================================================
// RESUME ANALYSIS
// ==========================================================

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


// ==========================================================
// INTERVIEW CHAT
// ==========================================================

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


// ==========================================================
// JOB CHAT
// ==========================================================

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


// ==========================================================
// MOCK INTERVIEW
// ==========================================================

// Start Mock Interview
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


// Evaluate Mock Interview
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


// ==========================================================
// CODING
// ==========================================================

// Get Coding Questions
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


// Run Coding
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


// Evaluate Coding
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


// ==========================================================
// PROJECTS
// ==========================================================

// Generate Project Recommendations
export const getProjectRecommendations = async (data) => {

  try {

    const response = await axios.post(
      `${API}/projects`,
      data
    );

    return response.data;

  } catch (error) {

    console.error(
      "Project Recommendations Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// Get Projects
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


// Generate Project Guide
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


// ==========================================================
// JOBS
// ==========================================================

// Filter Jobs
export const filterJobs = async (data) => {

  try {

    const response = await axios.post(
      `${API}/jobs/filter`,
      data
    );

    return response.data;

  } catch (error) {

    console.error(
      "Job Filter Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==========================================================
// EXPORT API URL
// ==========================================================

export default API;
