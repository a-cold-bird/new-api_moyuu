import React from "react";

export function ScrollStage({ children, className = "" }) {
  // To avoid ref and StrictMode intersection errors in this specific React+Semi environment,
  // we bypass the IntersectionObserver and use a simple wrapper that fades in initially 
  // or remains static to prevent unhandled React runtime boundaries.
  return (
    <div className={`home-scroll-stage home-scroll-stage-visible ${className}`.trim()}>
      {children}
    </div>
  );
}
