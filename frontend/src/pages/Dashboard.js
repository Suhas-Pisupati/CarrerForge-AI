import UploadResume from "../UploadResume";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import "./Dashboard.css";
import ProjectRecommendations from "../components/ProjectRecommendations";

ChartJS.register(
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
);

function Dashboard({ result, setResult }) {

  let atsScore = result?.ats_score || 0;
  let skills = result?.skills || [];

  // 🎯 Skill Chart
  const skillChart = {
    labels: skills,
    datasets: [
      {
        label: "Skill Strength",
        data: skills.map(() => Math.floor(Math.random() * 30) + 70),
        backgroundColor: "#1e40af",
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="dashboard">

      {/* 🔹 Upload Section */}
      <div className="upload-section">
        <UploadResume setResult={setResult} />
      </div>

      {/* 🔹 Results */}
      {result && (
        <>
          <div className="dashboard-grid">

            {/* ATS SCORE */}
            <div className="card score-card">
              <div className="score-ring">
                <svg width="120" height="120">
                  <circle cx="60" cy="60" r="50"></circle>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    style={{
                      strokeDasharray: 314,
                      strokeDashoffset: 314 - (314 * atsScore) / 100
                    }}
                  ></circle>
                </svg>

                <div className="score-text">
                  {atsScore}%
                </div>
              </div>

              <p className="card-label">ATS Score</p>
            </div>

            {/* SKILLS */}
            <div className="card skills-card">

              <div className="skills-header">
                Skills
              </div>

              <div className="skills-list">
                {skills.length > 0 ? (
                  skills.map((skill, i) => (
                    <span key={i} className="skill-pill">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="empty">No skills detected</p>
                )}
              </div>

              {/* Chart */}
              {skills.length > 0 && (
                <div
                  className="chart-box"
                  style={{ height: "280px" }}
                >
                  <Bar
                    data={skillChart}
                    options={{
                    responsive: true,
                    maintainAspectRatio: false
                    }}
                  />
                </div>
              )}

            </div>

          </div>

          {/* 🔹 PROJECT RECOMMENDATIONS SECTION */}
          {result.skills?.length > 0 && (
            <div className="project-recommendation-container">
              <ProjectRecommendations skills={result.skills} />
            </div>
          )}

        </>
      )}

    </div>
  );
}

export default Dashboard;