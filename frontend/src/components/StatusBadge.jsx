import React from "react";

const MAP = {
  CREATED: "tag tag-muted",
  UPLOADED: "tag tag-info",
  PROCESSING: "tag tag-warn",
  COMPLETED: "tag tag-success",
  FAILED: "tag tag-danger",
};

export default function StatusBadge({ status }) {
  const value = status || "UNKNOWN";
  return <span className={MAP[value] || "tag tag-muted"}>{value}</span>;
}
