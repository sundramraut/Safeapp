// src/pages/ProfileSetup.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { AuthContext } from "../App";

const ROLES = ["Caregiver", "CNA", "HHA", "CMT", "LPN", "RN", "Nurse Practitioner", "Companion", "Home Health Aide", "Private Duty Nurse"];
const SPECIALTIES = ["Elder Care", "Post-Surgical", "Dementia/Alzheimer's", "Pediatric Care", "Wound Care", "Medication Management", "Mobility Assistance", "Companionship", "Respite Care", "Hospice Support"];
const LANGUAGES = ["English", "Spanish", "French", "Mandarin", "Cantonese", "Portuguese", "Arabic", "Hindi", "Tagalog"];

export default function ProfileSetup() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    role: "",
    bio: "",
    yearsExperience: "",
    hourlyRate: "",
    specialties: [],
    languages: ["English"],
    certifications: "",
    serviceArea: "",
    availabilityNotes: "",
    phone: ""
  });

  const toggleSpecialty = (s) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s]
    }));
  };

  const toggleLanguage = (l) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(l)
        ? f.languages.filter(x => x !== l)
        : [...f.languages, l]
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.role) { setError("Please select your role."); return; }
    setError("");
    setLoading(true);
    try {
      let photoURL = null;
      if (photoFile) {
        const storageRef = ref(storage, `profiles/${user.uid}/photo`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "providers", user.uid), {
        uid: user.uid,
        ...form,
        photoURL,
        rating: 0,
        reviewCount: 0,
        verified: false,
        backgroundChecked: false,
        licenseVerified: false,
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Mark profile complete
      await setDoc(doc(db, "users", user.uid), { profileComplete: true }, { merge: true });

      navigate("/");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: "24px 24px 100px" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: n <= step ? "var(--sage)" : "var(--border)",
            transition: "background .3s"
          }} />
        ))}
      </div>

      {step === 1 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="display display-lg">Build your <em>profile</em></div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Step 1 of 3 — Basic info</div>
          </div>

          {/* Photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div className="avatar avatar-xl" style={{ width: 80, height: 80, fontSize: 32, cursor: "pointer" }}
              onClick={() => document.getElementById("photo-input").click()}>
              {photoPreview ? <img src={photoPreview} alt="preview" /> : "📷"}
            </div>
            <input id="photo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            <div style={{ fontSize: 12, color: "var(--sage)", fontWeight: 600, cursor: "pointer" }}
              onClick={() => document.getElementById("photo-input").click()}>
              Upload profile photo
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Your Role</label>
            <select className="input select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="">Select your role…</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Years of Experience</label>
            <input className="input" type="number" min="0" max="50"
              placeholder="e.g. 5"
              value={form.yearsExperience}
              onChange={e => setForm({ ...form, yearsExperience: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">Hourly Rate ($)</label>
            <input className="input" type="number" min="10" max="500"
              placeholder="e.g. 35"
              value={form.hourlyRate}
              onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input className="input" type="tel" placeholder="(410) 555-0100"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="display display-lg">Your <em>specialties</em></div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Step 2 of 3 — Skills & availability</div>
          </div>

          <div>
            <div className="section-heading">Specialties (select all that apply)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPECIALTIES.map(s => (
                <div key={s}
                  onClick={() => toggleSpecialty(s)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all .15s",
                    border: `1.5px solid ${form.specialties.includes(s) ? "var(--sage)" : "var(--border)"}`,
                    background: form.specialties.includes(s) ? "var(--sage-pale)" : "var(--white)",
                    color: form.specialties.includes(s) ? "var(--sage)" : "var(--ink)"
                  }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-heading">Languages</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LANGUAGES.map(l => (
                <div key={l}
                  onClick={() => toggleLanguage(l)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: `1.5px solid ${form.languages.includes(l) ? "var(--sage)" : "var(--border)"}`,
                    background: form.languages.includes(l) ? "var(--sage-pale)" : "var(--white)",
                    color: form.languages.includes(l) ? "var(--sage)" : "var(--ink)"
                  }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Service Area</label>
            <input className="input" type="text" placeholder="e.g. Baltimore, Columbia, Laurel, MD"
              value={form.serviceArea}
              onChange={e => setForm({ ...form, serviceArea: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">Availability</label>
            <input className="input" type="text" placeholder="e.g. Weekdays 8am–6pm, some weekends"
              value={form.availabilityNotes}
              onChange={e => setForm({ ...form, availabilityNotes: e.target.value })} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="display display-lg">Almost <em>done</em></div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Step 3 of 3 — Bio & certifications</div>
          </div>

          <div className="input-group">
            <label className="input-label">Bio</label>
            <textarea className="input textarea"
              placeholder="Tell families and facilities about your experience, approach to care, and what makes you a trusted professional…"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">Certifications & Licenses</label>
            <textarea className="input textarea" style={{ minHeight: 70 }}
              placeholder="e.g. RN License #12345 (MD), BLS Certified, CPR Certified, Dementia Care Training…"
              value={form.certifications}
              onChange={e => setForm({ ...form, certifications: e.target.value })} />
          </div>

          {/* Verification info box */}
          <div style={{
            background: "var(--sage-pale)",
            border: "1px solid rgba(74,124,111,.2)",
            borderRadius: 14,
            padding: "14px 16px"
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)", marginBottom: 6 }}>🔐 Verification coming next</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              After submitting, our team will reach out to verify your identity, license, and background check. Verified badges increase your booking rate significantly.
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : "Launch My Profile 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

