import React from "react";

export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="card center">
      <div className="spinner" />
      <p className="muted">{text}</p>
    </div>
  );
}
