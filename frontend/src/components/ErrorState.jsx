import React from "react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card">
      <h3>Something went wrong</h3>
      <p className="muted">{message || "Request failed."}</p>
      {onRetry ? (
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
