// src/pages/ProviderHome.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { AuthContext } from "../App";

export default function ProviderHome() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cases"); // "cases" | "profile"

  // Load provider's own profile
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "providers", user.uid), (snap) => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [user]);

  // Real-time open cases feed
  useEffect(() => {
    const q = query(
      collection(db, "cases"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openCases = cases.filter(c => c.status === "open");

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-logo">S<span>a</span>fe</div>
        <div className="topbar-actions">
          <Link to="/messages" style={{ color: "var(--ink)", textDecoration: "none" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 5h16v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 5l8 7 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>
          <div onClick={() => signOut(auth)} style={{ cursor: "pointer", color: "var(--muted)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3M13 14l3-4-3-4M16 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", margin: "16px 22px 0", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 4 }}>
        {[
          { key: "cases", label: "Open Cases" },
          { key: "profile", label: "My Profile" }
        ].map(t => (
          <div key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, textAlign: "center", padding: "9px 0",
              borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
              background: tab === t.key ? "var(--sage)" : "transparent",
              color: tab === t.key ? "white" : "var(--muted)"
            }}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === "cases" ? (
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="display display-lg">Open <em>cases</em></div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{openCases.length} care requests near you</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
          ) : openCases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No open cases yet</div>
              <div className="empty-state-sub">New care requests will appear here in real time</div>
            </div>
          ) : (
            openCases.map((c, i) => <CaseCard key={c.id} caseData={c} delay={i * 0.05} />)
          )}
        </div>
      ) : (
        <ProviderProfileTab profile={profile} user={user} navigate={navigate} />
      )}

      {/* Bottom nav for provider */}
      <div className="bottom-nav">
        <div className={`nav-item ${tab === "cases" ? "active" : ""}`} onClick={() => setTab("cases")}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 8h8M7 11h6M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="nav-label">Cases</span>
        </div>
        <Link to="/messages" className="nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 5h16v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 5l8 7 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="nav-label">Messages</span>
        </Link>
        <div className={`nav-item ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 17c0-3 2.5-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="11" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="nav-label">Profile</span>
        </div>
      </div>
    </div>
  );
}

function CaseCard({ caseData: c, delay }) {
  const urgencyColors = {
    urgent: { bg: "#fde8e8", color: "var(--red-soft)", label: "Urgent" },
    this_week: { bg: "var(--warm-pale)", color: "#9a7540", label: "This Week" },
    flexible: { bg: "var(--sage-pale)", color: "var(--sage)", label: "Flexible" }
  };
  const urg = urgencyColors[c.urgency] || urgencyColors.flexible;

  return (
    <Link to={`/case/${c.id}`} style={{ textDecoration: "none" }}>
      <div className="card fade-up" style={{ animationDelay: `${delay}s` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", flex: 1, paddingRight: 10 }}>{c.title}</div>
          <div style={{ background: urg.bg, color: urg.color, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
            {urg.label}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>
          {c.careType && <span style={{ marginRight: 8 }}>🏥 {c.careType}</span>}
          {c.roleNeeded && c.roleNeeded !== "Any" && <span style={{ marginRight: 8 }}>👤 {c.roleNeeded}</span>}
          {c.location && <span>📍 {c.location}</span>}
        </div>
        {c.details && (
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, marginBottom: 8 }}>
            {c.details.length > 100 ? c.details.slice(0, 100) + "…" : c.details}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {c.budget && <div style={{ fontSize: 12, color: "var(--sage)", fontWeight: 600 }}>💰 {c.budget}</div>}
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Posted by {c.clientName || "Client"}</div>
        </div>
      </div>
    </Link>
  );
}

function ProviderProfileTab({ profile, user, navigate }) {
  if (!profile) return (
    <div className="empty-state" style={{ padding: "60px 24px" }}>
      <div className="empty-state-icon">👤</div>
      <div className="empty-state-title">No profile yet</div>
      <div className="empty-state-sub">Set up your profile to start receiving case requests</div>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/profile-setup")}>
        Set Up Profile
      </button>
    </div>
  );

  const initials = (profile.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Profile header */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div className="avatar avatar-xl">
          {profile.photoURL ? <img src={profile.photoURL} alt={profile.name} /> : initials}
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: "var(--sage)", fontWeight: 500 }}>{profile.role}</div>
          {profile.serviceArea && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>📍 {profile.serviceArea}</div>}
        </div>
      </div>

      {/* Verification status */}
      <div>
        <div className="section-heading">Your Verification Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <VerifRow label="Identity Verified" done={profile.verified} />
          <VerifRow label="Background Check" done={profile.backgroundChecked} />
          <VerifRow label="License Verified" done={profile.licenseVerified} />
          <VerifRow label="Profile Complete" done={!!profile.bio} />
        </div>
      </div>

      <div className="divider" />

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300 }}>{profile.reviewCount || 0}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Reviews</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300 }}>
            {profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Rating</div>
        </div>
      </div>

      <button className="btn btn-outline btn-full" onClick={() => navigate("/profile-setup")}>
        Edit My Profile
      </button>

      {/* Toggle availability */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Available for Work</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Clients can see and contact you</div>
        </div>
        <div style={{
          width: 44, height: 26, borderRadius: 13,
          background: profile.available ? "var(--sage)" : "var(--border)",
          position: "relative", cursor: "pointer", transition: "background .2s"
        }}>
          <div style={{
            position: "absolute", top: 3, left: profile.available ? 21 : 3,
            width: 20, height: 20, borderRadius: "50%", background: "white",
            transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.15)"
          }} />
        </div>
      </div>
    </div>
  );
}

function VerifRow({ label, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: done ? "var(--sage)" : "var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0
      }}>
        {done ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)" }} />
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: done ? "var(--ink)" : "var(--muted)" }}>{label}</div>
      {!done && <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--sage)", fontWeight: 600 }}>Pending</div>}
    </div>
  );
}

