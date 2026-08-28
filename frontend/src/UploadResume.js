import { useState, useRef } from "react";
import { analyzeResume } from "./api";
import "./UploadResume.css";

function UploadResume({ setResult }) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  // Handle file select
  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Upload API
  const handleUpload = async () => {

    if (!file) {
      alert("Please upload a resume");
      return;
    }

    try {

      setLoading(true);
      setResult(null);

      const data = await analyzeResume(file);

      setResult(data);

    } catch (error) {

      console.error(error);
      alert("Resume analysis failed");

    }

    setLoading(false);
  };

  return (

    <div className="upload-container">

      <h2 className="upload-heading">
        Upload Resume
      </h2>

      {/* Upload Box */}

      <div
        className="upload-box"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >

        <div className="upload-content">

          <p className="upload-title">
            Drag & Drop Resume
          </p>

          <p className="upload-sub">
            or Click to Upload (.pdf, .doc, .docx)
          </p>

          {file && (
            <p className="file-name">
              📄 {file.name}
            </p>
          )}

        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={(e) =>
            handleFileChange(e.target.files[0])
          }
        />

      </div>

      {/* Button */}

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={loading}
      >

        {loading
          ? "Analyzing..."
          : "Analyze Resume"}

      </button>

      {loading && (
        <div className="loader"></div>
      )}

    </div>

  );
}

export default UploadResume;