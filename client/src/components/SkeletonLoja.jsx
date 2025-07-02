import React from "react";
import "./SkeletonLoja.css";

export default function SkeletonLoja() {
  return (
    <div className="skeleton-loja-container">
      <div className="skeleton-loja-header shimmer" />
      <div className="skeleton-loja-banner shimmer" />
      <div className="skeleton-loja-menu shimmer" />
      <div className="skeleton-loja-content">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-loja-card shimmer" />
        ))}
      </div>
    </div>
  );
}
