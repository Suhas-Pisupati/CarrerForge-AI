import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chatbot.css";

function Chatbot({ apiEndpoint, resumeText }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChat((prev) => [...prev, { type: "user", text: message }]);
    setLoading(true);

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/${apiEndpoint}`,
        {
          message,
          resume_text: resumeText || ""
        }
      );

      setChat((prev) => [
        ...prev,
        { type: "bot", data: res.data }
      ]);

    } catch {
      setChat((prev) => [
        ...prev,
        { type: "bot", data: null }
      ]);
    }

    setMessage("");
    setLoading(false);
  };

  // 🎯 IMPORTANT FIX: FILTER BASED ON PAGE
  const renderBotResponse = (data) => {
    if (!data) return <div className="empty">No results</div>;

    // ✅ INTERVIEW PAGE ONLY
    if (apiEndpoint === "interview-chat" && data.type === "interview") {
      return (
        <div className="qa-list">
          {data.items.map((item, i) => (
            <div key={i} className="qa-card">
              <div className="q">{item.question}</div>
              <div className="a">{item.answer}</div>
            </div>
          ))}
        </div>
      );
    }

    // ✅ JOB PAGE ONLY
    if (apiEndpoint === "job-chat" && data.type === "jobs") {
      return (
        <div className="job-grid">
          {data.items.map((job, i) => (
            <div key={i} className="job-card">
              <h4>{job.role || job.title}</h4>
              <p>{job.company}</p>
              <span>{job.location}</span>

              <a href={job.apply_link} target="_blank" rel="noreferrer">
                Apply →
              </a>
            </div>
          ))}
        </div>
      );
    }

    return <div className="empty">No relevant data</div>;
  };

  return (
    <div className="chat-container">

      {/* HEADER */}
      <div className="chat-header">
        Career Assistant 💬
      </div>

      {/* CHAT BODY */}
      <div className="chat-body">
        {chat.map((msg, i) => (
          <div key={i} className={`row ${msg.type}`}>
            {msg.type === "user" ? (
              <div className="bubble user">{msg.text}</div>
            ) : (
              <div className="bubble bot">
                {renderBotResponse(msg.data)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bubble bot">Typing...</div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT */}
      <div className="chat-input">

        {/* TEXT INPUT */}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
        />

        {/* 🎤 MIC BUTTON */}
        <button className="mic-btn">
          🎤
        </button>

        {/* ➤ SEND BUTTON */}
        <button className="send-btn" onClick={sendMessage}>
          ➤
        </button>

      </div>
    </div>
  );
}

export default Chatbot;