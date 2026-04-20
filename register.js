// src/pages/Register.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(""); // "client" | "provider"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role) { setError("Please select your account type."); return; }
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // Save user doc to Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        role,
        createdAt: serverTimestamp(),
        profileComplete: false
      });
      // Providers go to profile setup, clients go home
      navigate(role === "provider" ? "/profile-setup" : "/");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("An account with this email already exists.");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back */}
      <Link to="/login" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to login
      </Link>

      <div>
        <div className="display display-lg">Create your <em>account</em></div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Join Safe and find trusted care</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Step 1: Role selection */}
      <div>
        <div className="section-heading">I am a…</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <RoleCard
            selected={role === "client"}
            onClick={() => setRole("client")}
            icon="🏠"
            title="Client / Family"
            sub="Looking for care for myself or a loved one"
          />
          <RoleCard
            selected={role === "provider"}
            onClick={() => setRole("provider")}
            icon="🩺"
            title="Care Professional"
            sub="Caregiver, CNA, LPN, RN, or other provider"
          />
        </div>
      </div>

      {/* Step 2: Details */}
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="Angela Martinez"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>

        <button className="btn btn-dark btn-full" type="submit" disabled={loading || !role}>
          {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : "Create Account →"}
        </button>

        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
          By creating an account you agree to Safe's Terms of Service and Privacy Policy.
        </div>
      </form>
    </div>
  );
}

function RoleCard({ selected, onClick, icon, title, sub }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px 12px",
        borderRadius: 14,
        border: `2px solid ${selected ? "var(--sage)" : "var(--border)"}`,
        background: selected ? "var(--sage-pale)" : "var(--white)",
        cursor: "pointer",
        transition: "all .2s",
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "var(--sage)" : "var(--ink)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

