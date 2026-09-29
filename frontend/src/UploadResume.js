import {
  useState,
  useRef
} from "react";

import {
  analyzeResume
} from "./api";

import "./UploadResume.css";

function UploadResume({
  setResult
}) {

  const [file, setFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const fileInputRef =
    useRef(null);

  /*
   * =========================
   * FILE VALIDATION
   * =========================
   */

  const handleFileChange =
    (selectedFile) => {

      if (!selectedFile) {
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];

      const extensionOK =
        /\.(pdf|doc|docx)$/i.test(
          selectedFile.name
        );

      if (
        !extensionOK &&
        !allowedTypes.includes(
          selectedFile.type
        )
      ) {

        alert(
          "Please upload a PDF, DOC or DOCX resume."
        );

        return;
      }

      setFile(
        selectedFile
      );
    };

  /*
   * =========================
   * DRAG & DROP
   * =========================
   */

  const handleDrop = (event) => {

    event.preventDefault();

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileChange(
        droppedFile
      );
    }
  };

  const handleDragOver = (
    event
  ) => {

    event.preventDefault();
  };

  /*
   * =========================
   * ANALYZE NEW RESUME
   * =========================
   */

  const handleUpload =
    async () => {

      if (!file) {

        alert(
          "Please upload a resume"
        );

        return;
      }

      try {

        setLoading(true);

        /*
         * VERY IMPORTANT:
         *
         * Remove old resume context
         * BEFORE analyzing the new one.
         *
         * This prevents:
         *
         * Old Python resume
         *       ↓
         * New MBA resume
         *       ↓
         * Old Python skills remaining
         */

        setResult(null);

        /*
         * Analyze the NEW resume.
         */

        const data =
          await analyzeResume(
            file
          );

        if (
          !data ||
          data.error
        ) {

          throw new Error(
            data?.error ||
            "Resume analysis failed."
          );
        }

        /*
         * Create a completely
         * fresh resume context.
         */

        const freshResult = {

          ...data,

          /*
           * Every upload receives
           * its own resume ID.
           */

          resume_id:
            data.resume_id ||
            `${Date.now()}_${file.name}`,

          /*
           * Current skills only.
           */

          skills:
            Array.isArray(
              data.skills
            )
              ? [
                  ...data.skills
                ]
              : [],

          /*
           * Current questions only.
           */

          questions:
            data.questions ||
            {
              beginner: [],
              intermediate: [],
              advanced: []
            },

          /*
           * Current jobs only.
           */

          jobs:
            Array.isArray(
              data.jobs
            )
              ? [
                  ...data.jobs
                ]
              : [],

          /*
           * Current roles only.
           */

          roles:
            Array.isArray(
              data.roles
            )
              ? [
                  ...data.roles
                ]
              : [],

          /*
           * Current resume text.
           */

          resume_text:
            data.resume_text ||
            "",

          /*
           * Keep missing skills
           * if backend returns them.
           */

          missing_skills:
            Array.isArray(
              data.missing_skills
            )
              ? [
                  ...data.missing_skills
                ]
              : [],

          /*
           * Keep suggestions.
           */

          suggestions:
            Array.isArray(
              data.suggestions
            )
              ? [
                  ...data.suggestions
                ]
              : []
        };

        /*
         * THIS replaces the entire
         * previous resume context.
         */

        setResult(
          freshResult
        );

        /*
         * Allow the SAME filename
         * to be selected again.
         */

        if (
          fileInputRef.current
        ) {

          fileInputRef.current.value =
            "";
        }

        setFile(null);

      } catch (error) {

        console.error(
          "Resume analysis error:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Resume analysis failed."
        );

      } finally {

        setLoading(false);
      }
    };

  return (
    <div className="upload-container">

      <h2 className="upload-heading">
        Upload Resume
      </h2>

      <div
        className="upload-box"
        onClick={() =>
          fileInputRef.current?.click()
        }
        onDrop={
          handleDrop
        }
        onDragOver={
          handleDragOver
        }
      >

        <div className="upload-content">

          <p className="upload-title">
            Drag & Drop Resume
          </p>

          <p className="upload-sub">
            or Click to Upload
            (.pdf, .doc, .docx)
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
          onChange={(event) =>
            handleFileChange(
              event.target.files?.[0]
            )
          }
        />

      </div>

      <button
        className="upload-btn"
        onClick={
          handleUpload
        }
        disabled={loading}
      >

        {loading
          ? "Analyzing New Resume..."
          : "Analyze Resume"}

      </button>

      {loading && (
        <div className="loader"></div>
      )}

    </div>
  );
}

export default UploadResume;