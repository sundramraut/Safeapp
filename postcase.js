// src/pages/PostCase.js
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../App";
import { BottomNav } from "./ClientHome";

const CARE_TYPES = ["In-Home Care", "Post-Surgical", "Companionship", "Facility Shift", "Respite Care", "Telehealth", "Overnight Care", "Private Duty"];
const ROLES_NEEDED = ["Any", "Caregiver", "CNA", "HHA", "LPN", "RN", "Companion", "Nurse Practitioner"];

export default function PostCase() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    careType: "",
    roleNeeded: "Any",
    location: "",
    urgency: "flexible",
    schedule: "",
    details: "",
    budget: ""
  });

  const handleSubmit = async () => {
    if (!form.title || !form.careType || !form.location) {
      setError("Please fill in the title, care type, and location.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await addDoc(collection(db, "cases"), {
        ...form,
        clientId: user.uid,
        clientName: user.displayName || "Anonymous",
        clientEmail: user.email,
        status: "open",         // open | matched | closed
        applicants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setError("Failed to post case. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 60 }}>✅</div>
        <div className="display display-lg" style={{ textAlign: "center" }}>Case <em>posted!</em></div>
        <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
          Your care request is live. Verified professionals can now view and apply. We'll notify you when you get matches.
        </div>
        <div style={{ width: 60, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "var(--sage)", animation: "fill 2.5s linear forwards" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: "var(--ink)", padding: "16px 22px 24px" }}>
        <Link to="/" style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back
        </Link>
        <div className="display display-lg" style={{ color: "white" }}>
          Post a <em style={{ color: "var(--sage-light)" }}>care case</em>
        </div>
        <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          Describe your need and get matched with verified professionals.
        </div>
      </div>

      <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
        {error && <div className="error-msg">{error}</div>}

        {/* Title */}
        <div className="input-group">
          <label className="input-label">Case Title</label>
          <input className="input" type="text"
            placeholder="e.g. Need overnight RN after hip surgery"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        {/* Care type */}
        <div>
          <div className="section-heading">Type of Care</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CARE_TYPES.map(t => (
              <div key={t}
                onClick={() => setForm({ ...form, careType: t })}
                style={{
                  padding: "11px 12px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all .15s",
                  border: `1.5px solid ${form.careType === t ? "var(--sage)" : "var(--border)"}`,
                  background: form.careType === t ? "var(--sage-pale)" : "var(--white)",
                  color: form.careType === t ? "var(--sage)" : "var(--ink)"
                }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Role needed */}
        <div className="input-group">
          <label className="input-label">Professional Role Needed</label>
          <select className="input select" value={form.roleNeeded} onChange={e => setForm({ ...form, roleNeeded: e.target.value })}>
            {ROLES_NEEDED.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Location */}
        <div className="input-group">
          <label className="input-label">Location / City</label>
          <input className="input" type="text" placeholder="e.g. Baltimore, MD 21201"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>

        {/* Schedule */}
        <div className="input-group">
          <label className="input-label">Schedule / Dates</label>
          <input className="input" type="text" placeholder="e.g. Mon–Fri 8am–4pm, starting next week"
            value={form.schedule}
            onChange={e => setForm({ ...form, schedule: e.target.value })} />
        </div>

        {/* Budget */}
        <div className="input-group">
          <label className="input-label">Budget ($/hr, optional)</label>
          <input className="input" type="text" placeholder="e.g. $30–$45/hr"
            value={form.budget}
            onChange={e => setForm({ ...form, budget: e.target.value })} />
        </div>

        {/* Urgency */}
        <div>
          <div className="section-heading">Urgency</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { val: "flexible", label: "Flexible", color: "var(--sage)", bg: "var(--sage-pale)" },
              { val: "this_week", label: "This Week", color: "#9a7540", bg: "var(--warm-pale)" },
              { val: "urgent", label: "Urgent", color: "var(--red-soft)", bg: "#fde8e8" }
            ].map(u => (
              <div key={u.val}
                onClick={() => setForm({ ...form, urgency: u.val })}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  borderRadius: 10,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `2px solid ${form.urgency === u.val ? u.color : "transparent"}`,
                  background: u.bg,
                  color: u.color
                }}>
                {u.label}
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="input-group">
          <label className="input-label">Additional Details</label>
          <textarea className="input textarea"
            placeholder="Share any specific needs, conditions, or requirements that will help professionals understand this case…"
            value={form.details}
            onChange={e => setForm({ ...form, details: e.target.value })} />
        </div>

        <button className="btn btn-dark btn-full" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : "Post My Case →"}
        </button>
      </div>

      <BottomNav active="post" />
    </div>
  );
}

