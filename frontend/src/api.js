import axios from "axios";

const API =
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";

console.log("API URL:", API);


// ==============================
// AUTHENTICATION
// ==============================

// Register User
export const registerUser = async (data) => {
  try {
    const response = await axios.post(
      `${API}/auth/register`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
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


// Login User
export const loginUser = async (data) => {
  try {
    const response = await axios.post(
      `${API}/auth/login`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
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


// Get Current User
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

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


// ==============================
// RESUME ANALYSIS
// ==============================

export const analyzeResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  try {
    const response = await axios.post(
      `${API}/analyze`,
      formData
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


// ==============================
// INTERVIEW CHAT
// ==============================

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


// ==============================
// JOB CHAT
// ==============================

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


// ==============================
// MOCK INTERVIEW
// ==============================

export const startMockInterview = async (data) => {
  try {
    const response = await axios.post(
      `${API}/mock/start`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Mock Interview Start Error:",
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
      "Mock Interview Evaluation Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==============================
// CODING QUESTIONS
// ==============================

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


// ==============================
// RUN CODING
// ==============================

export const runCoding = async (data) => {
  try {
    const response = await axios.post(
      `${API}/coding/run`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Coding Run Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==============================
// EVALUATE CODING
// ==============================

export const evaluateCoding = async (data) => {
  try {
    const response = await axios.post(
      `${API}/coding/evaluate`,
      data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Coding Evaluation Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==============================
// PROJECTS
// ==============================

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


// ==============================
// PROJECT GUIDE
// ==============================

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


// ==============================
// EXPORT BASE API URL
// ==============================

export default API;
