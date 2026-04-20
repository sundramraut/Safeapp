// src/pages/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "var(--ink)", padding: "48px 28px 36px", textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 64,
          fontWeight: 300,
          color: "white",
          letterSpacing: -2,
          lineHeight: 1
        }}>
          S<span style={{ color: "var(--sage)" }}>a</span>fe
        </div>
        <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginTop: 8 }}>
          Trusted Care Platform
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: "36px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div className="display display-lg" style={{ marginBottom: 6 }}>Welcome <em>back</em></div>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>Sign in to your account</div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-dark btn-full" type="submit" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

