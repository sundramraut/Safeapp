// src/pages/CaseDetail.js
import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../App";

export default function CaseDetail() {
  const { id } = useParams();
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "cases", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setCaseData(data);
        // Check if already applied
        if (user && data.applicants?.includes(user.uid)) setApplied(true);
      }
      setLoading(false);
    });
    return unsub;
  }, [id, user]);

  const handleApply = async () => {
    if (!user || applied) return;
    setApplying(true);
    try {
      await updateDoc(doc(db, "cases", id), {
        applicants: arrayUnion(user.uid)
      });
      // Start message thread with client
      const threadId = [user.uid, caseData.clientId].sort().join("_");
      navigate(`/messages/${threadId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;
  if (!caseData) return <div className="page" style={{ padding: 40 }}><div className="empty-state"><div className="empty-state-title">Case not found</div></div></div>;

  const urgencyColors = {
    urgent: { bg: "#fde8e8", color: "var(--red-soft)", label: "Urgent" },
    this_week: { bg: "var(--warm-pale)", color: "#9a7540", label: "This Week" },
    flexible: { bg: "var(--sage-pale)", color: "var(--sage)", label: "Flexible" }
  };
  const urg = urgencyColors[caseData.urgency] || urgencyColors.flexible;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: "var(--ink)", padding: "16px 22px 28px" }}>
        <Link to="/" style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back
        </Link>
        <div style={{
          display: "inline-block",
          background: urg.bg, color: urg.color,
          padding: "5px 10px", borderRadius: 7,
          fontSize: 11, fontWeight: 700, marginBottom: 12
        }}>
          {urg.label}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: "white", lineHeight: 1.2 }}>
          {caseData.title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {caseData.careType && <span>🏥 {caseData.careType}</span>}
          {caseData.roleNeeded && caseData.roleNeeded !== "Any" && <span>👤 {caseData.roleNeeded}</span>}
          {caseData.location && <span>📍 {caseData.location}</span>}
        </div>
        {caseData.budget && (
          <div style={{ marginTop: 12, fontSize: 14, color: "var(--sage-light)", fontWeight: 600 }}>💰 {caseData.budget}</div>
        )}
      </div>

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Details */}
        {caseData.details && (
          <div>
            <div className="section-heading">Case Details</div>
            <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.7 }}>{caseData.details}</div>
          </div>
        )}

        {/* Schedule */}
        {caseData.schedule && (
          <div>
            <div className="section-heading">Schedule</div>
            <div style={{ fontSize: 14, color: "var(--ink)" }}>{caseData.schedule}</div>
          </div>
        )}

        <div className="divider" />

        {/* Meta */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Posted by</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{caseData.clientName || "Client"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Status</span>
            <span className="badge badge-green">{caseData.status === "open" ? "Open" : caseData.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Interested</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{caseData.applicants?.length || 0} provider{caseData.applicants?.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Apply button — only show to providers */}
        {userRole === "provider" && caseData.status === "open" && (
          <div style={{ position: "sticky", bottom: 20 }}>
            {applied ? (
              <div style={{
                padding: 15, borderRadius: 14, background: "var(--sage-pale)",
                border: "1px solid rgba(74,124,111,.2)", textAlign: "center",
                fontSize: 14, fontWeight: 600, color: "var(--sage)"
              }}>
                ✓ You've expressed interest — message the client!
              </div>
            ) : (
              <button className="btn btn-dark btn-full" onClick={handleApply} disabled={applying}>
                {applying ? <div className="spinner" style={{ width: 18, height: 18 }} /> : "Express Interest & Message Client →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

