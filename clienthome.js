// src/pages/ClientHome.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { AuthContext } from "../App";

const ROLE_FILTERS = ["All", "RN", "LPN", "CNA", "HHA", "Caregiver", "Companion"];

export default function ClientHome() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Real-time listener for providers
  useEffect(() => {
    let q;
    if (roleFilter === "All") {
      q = query(collection(db, "providers"), orderBy("rating", "desc"), limit(20));
    } else {
      q = query(
        collection(db, "providers"),
        where("role", "==", roleFilter),
        orderBy("rating", "desc"),
        limit(20)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProviders(data);
      setLoading(false);
    });

    return unsub;
  }, [roleFilter]);

  const filtered = providers.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(s) ||
      (p.role || "").toLowerCase().includes(s) ||
      (p.serviceArea || "").toLowerCase().includes(s) ||
      (p.specialties || []).some(sp => sp.toLowerCase().includes(s))
    );
  });

  const firstName = user?.displayName?.split(" ")[0] || "there";

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

      <div style={{ padding: "20px 22px 0" }}>
        {/* Greeting */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Good day, {firstName}</div>
        <div className="display display-xl" style={{ marginBottom: 18 }}>
          Find <em>trusted</em> care
        </div>

        {/* Search */}
        <div style={{
          background: "var(--white)",
          border: "1.5px solid var(--border)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          marginBottom: 16
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="var(--muted)" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
            placeholder="Search by role, location, specialty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Role filters */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {ROLE_FILTERS.map(r => (
            <div key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                flexShrink: 0,
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .15s",
                background: roleFilter === r ? "var(--sage)" : "var(--white)",
                color: roleFilter === r ? "white" : "var(--ink)",
                border: `1.5px solid ${roleFilter === r ? "var(--sage)" : "var(--border)"}`
              }}>
              {r}
            </div>
          ))}
        </div>

        {/* Post case CTA */}
        <div onClick={() => navigate("/post-case")} style={{
          background: "var(--ink)",
          borderRadius: 16,
          padding: "16px 18px",
          marginBottom: 24,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 3 }}>Need care right now?</div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>Post a case and get matched instantly</div>
          </div>
          <div style={{
            background: "var(--sage)",
            borderRadius: 10,
            padding: "8px 14px",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: "nowrap"
          }}>Post Case →</div>
        </div>

        {/* Providers heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-heading" style={{ marginBottom: 0 }}>
            {roleFilter === "All" ? "All Professionals" : roleFilter + " Professionals"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} found</div>
        </div>
      </div>

      {/* Provider list */}
      <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No providers found</div>
            <div className="empty-state-sub">Try changing your filter or search term</div>
          </div>
        ) : (
          filtered.map((p, i) => (
            <ProviderCard key={p.id} provider={p} delay={i * 0.05} />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

function ProviderCard({ provider: p, delay }) {
  const initials = (p.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link to={`/provider/${p.id}`} style={{ textDecoration: "none" }}>
      <div className="card fade-up" style={{ animationDelay: `${delay}s`, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div className="avatar avatar-lg" style={{ fontSize: 20 }}>
          {p.photoURL ? <img src={p.photoURL} alt={p.name} /> : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{p.name}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", flexShrink: 0, marginLeft: 8 }}>
              ${p.hourlyRate}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)" }}>/hr</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {p.role}{p.yearsExperience ? ` · ${p.yearsExperience} yrs exp` : ""}
          </div>
          {p.serviceArea && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>📍 {p.serviceArea}</div>
          )}
          {p.rating > 0 && (
            <div className="stars" style={{ marginTop: 6 }}>
              {[1,2,3,4,5].map(n => <span key={n} className="star">{n <= Math.round(p.rating) ? "★" : "☆"}</span>)}
              <span className="star-count">{p.rating.toFixed(1)} ({p.reviewCount})</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {p.verified && <span className="badge badge-green">✓ Verified</span>}
            {p.backgroundChecked && <span className="badge badge-warm">Background Checked</span>}
            {p.available && <span style={{ fontSize: 11, color: "var(--sage)", fontWeight: 600 }}>● Available</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BottomNav({ active }) {
  return (
    <div className="bottom-nav">
      <Link to="/" className={`nav-item ${active === "home" ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 10.5L11 3l8 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 9v9h5v-5h2v5h5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="nav-label">Home</span>
      </Link>
      <Link to="/post-case" className={`nav-item ${active === "post" ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="nav-label">Post Case</span>
      </Link>
      <Link to="/messages" className={`nav-item ${active === "messages" ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 5h16v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 5l8 7 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="nav-label">Messages</span>
      </Link>
    </div>
  );
}

