import React, { useId, useMemo, useState } from "react";

export default function UploadZone({
  accept,
  file,
  onFile,
  icon,
  text,
  subtext,
}) {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);

  const displayText = useMemo(() => {
    if (file?.name) return file.name;
    return text || "Drag & drop or click to upload";
  }, [file, text]);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile?.(f);
  }

  function handleChange(e) {
    const f = e.target.files?.[0];
    if (f) onFile?.(f);
  }

  return (
    <div
      className={`u-upload-zone ${dragActive ? "drag" : ""} ${file ? "has-file" : ""}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          const el = document.getElementById(inputId);
          el?.click();
        }
      }}
    >
      <div className="u-upload-inner" aria-hidden="true">
        <div className="u-upload-icon">{icon}</div>
        <div className="u-upload-text">{displayText}</div>
        {subtext ? <div className="u-upload-sub">{subtext}</div> : null}
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="u-upload-input"
      />
    </div>
  );
}

