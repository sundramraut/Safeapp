// src/pages/ProviderProfile.js
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../App";

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time provider data
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "providers", id), (snap) => {
      if (snap.exists()) {
        setProvider({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // Load reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(collection(db, "reviews"), where("providerId", "==", id));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchReviews();
  }, [id]);

  const startMessage = async () => {
    if (!user) return;
    // Create or find thread
    const threadId = [user.uid, id].sort().join("_");
    navigate(`/messages/${threadId}`);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  if (!provider) return (
    <div className="page" style={{ padding: 40 }}>
      <div className="empty-state">
        <div className="empty-state-icon">😕</div>
        <div className="empty-state-title">Provider not found</div>
        <Link to="/" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>Go Home</Link>
      </div>
    </div>
  );

  const initials = (provider.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page">
      {/* Dark header */}
      <div style={{ background: "var(--ink)", padding: "16px 22px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(74,124,111,.2) 0%, transparent 70%)",
          borderRadius: "50%"
        }} />

        <Link to="/" style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          ← Back to results
        </Link>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div className="avatar avatar-xl" style={{ background: "linear-gradient(135deg, #7ab5a8, var(--sage))", border: "2px solid rgba(255,255,255,.15)" }}>
            {provider.photoURL ? <img src={provider.photoURL} alt={provider.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: "white", lineHeight: 1 }}>
              {provider.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--sage-light)", marginTop: 4, fontWeight: 500 }}>{provider.role}</div>
            {provider.serviceArea && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>📍 {provider.serviceArea}</div>
            )}
            {provider.rating > 0 && (
              <div className="stars" style={{ marginTop: 8 }}>
                {[1,2,3,4,5].map(n => <span key={n} className="star" style={{ fontSize: 13 }}>{n <= Math.round(provider.rating) ? "★" : "☆"}</span>)}
                <span style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginLeft: 4 }}>
                  {provider.rating.toFixed(1)} · {provider.reviewCount} reviews
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rate + availability */}
        <div style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "center" }}>
          {provider.hourlyRate && (
            <div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "white" }}>
                ${provider.hourlyRate}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>/hr</span>
            </div>
          )}
          {provider.available && (
            <div style={{ background: "rgba(74,124,111,.3)", padding: "6px 12px", borderRadius: 8 }}>
              <span style={{ color: "var(--sage-light)", fontSize: 12, fontWeight: 600 }}>● Available</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Trust badges */}
        <div>
          <div className="section-heading">Verification & Trust</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <TrustBadge active={provider.verified} label="Identity Verified" />
            <TrustBadge active={provider.backgroundChecked} label="Background Checked" gold />
            <TrustBadge active={provider.licenseVerified} label="License Verified" />
            <TrustBadge active={true} label="Safe Member" />
          </div>
        </div>

        <div className="divider" />

        {/* Specialties */}
        {provider.specialties?.length > 0 && (
          <div>
            <div className="section-heading">Specialties</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {provider.specialties.map(s => (
                <div key={s} style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: "var(--white)",
                  border: "1.5px solid var(--border)",
                  color: "var(--ink)"
                }}>{s}</div>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {[
            { num: provider.yearsExperience || "—", label: "Years Exp." },
            { num: provider.reviewCount || 0, label: "Reviews" },
            { num: provider.languages?.length || 1, label: "Languages" }
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "16px 8px", borderRight: i < 2 ? "1.5px solid var(--border)" : "none" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--ink)", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {provider.bio && (
          <div>
            <div className="section-heading">About</div>
            <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.7 }}>{provider.bio}</div>
          </div>
        )}

        {/* Certifications */}
        {provider.certifications && (
          <div>
            <div className="section-heading">Certifications & Licenses</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{provider.certifications}</div>
          </div>
        )}

        {/* Languages */}
        {provider.languages?.length > 0 && (
          <div>
            <div className="section-heading">Languages</div>
            <div style={{ fontSize: 13, color: "var(--ink)" }}>{provider.languages.join(", ")}</div>
          </div>
        )}

        {/* Availability */}
        {provider.availabilityNotes && (
          <div>
            <div className="section-heading">Availability</div>
            <div style={{ fontSize: 13, color: "var(--ink)" }}>{provider.availabilityNotes}</div>
          </div>
        )}

        <div className="divider" />

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <div className="section-heading">Reviews ({reviews.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.clientName || "Anonymous"}</div>
                    <div className="stars">
                      {[1,2,3,4,5].map(n => <span key={n} className="star" style={{ fontSize: 11 }}>{n <= r.rating ? "★" : "☆"}</span>)}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{r.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        {user && user.uid !== id && (
          <div style={{ display: "flex", gap: 10, position: "sticky", bottom: 20 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={startMessage}>Message</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={startMessage}>Book {provider.name?.split(" ")[0]}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrustBadge({ active, label, gold }) {
  return (
    <div style={{
      background: active ? (gold ? "var(--warm-pale)" : "var(--sage-pale)") : "var(--white)",
      border: `1px solid ${active ? (gold ? "rgba(200,169,122,.3)" : "rgba(74,124,111,.2)") : "var(--border)"}`,
      borderRadius: 10,
      padding: "9px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      opacity: active ? 1 : 0.5
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? (gold ? "var(--warm)" : "var(--sage)") : "var(--border)",
        flexShrink: 0
      }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: active ? (gold ? "#9a7540" : "var(--sage)") : "var(--muted)" }}>{label}</div>
    </div>
  );
}

