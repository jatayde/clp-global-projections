import React, { useState } from "react";
import estimatedStats from "./data/estimatedStats.json"; // { country: { "2030": {...}, "2040": {...}, "2050": {...} } }
import MapWorld from "./MapWorld";

const YEARS = ["2030", "2040", "2050"];

export default function App() {
  const [year, setYear] = useState("2030");

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Helvetica Neue",
        paddingBottom: 24,
        backgroundColor: "#f1f5f9",
      }}
    >
      <header style={{ textAlign: "center", padding: 16 }}>
        <h2 style={{ margin: 0 }}>
          Projecting the Future Incidence of Cleft Deformities and the
          Associated Economic Burden of 199 Countries
        </h2>
        <h4>
          The Department of Plastic and Reconstructive Surgery, The Ohio State
          University Wexner Medical Center
        </h4>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Year Tabs"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {YEARS.map((y) => {
          const isActive = y === year;
          return (
            <button
              key={y}
              role="tab"
              aria-selected={isActive}
              onClick={() => setYear(y)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #bbb",
                cursor: "pointer",
                background: isActive ? "#538A90" : "#f1f5f9",
                color: isActive ? "#fff" : "#111",
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? "0 2px 6px rgba(13,110,253,0.3)" : "none",
              }}
            >
              {y}
            </button>
          );
        })}
      </div>

      {/* Map for selected year */}
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <MapWorld
          year={year}
          data={estimatedStats}
          title={`Global – ${year}`}
          metric="incidence"
          scale="linear"
        />
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
          fontSize: "0.85em",
          color: "#555",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          padding: "4px 8px",
          borderRadius: "6px",
        }}
      >
        95% Confidence Interval
      </div>
    </div>
  );
}
