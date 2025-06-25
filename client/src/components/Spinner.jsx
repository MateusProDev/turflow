import React from "react";

export default function Spinner({ height = "70vh" }) {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height}}>
      <div className="spinner" style={{
        width:60,
        height:60,
        border:'6px solid #eee',
        borderTop:'6px solid #1976d2',
        borderRadius:'50%',
        animation:'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
