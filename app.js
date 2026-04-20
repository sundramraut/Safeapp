// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ClientHome from "./pages/ClientHome";
import PostCase from "./pages/PostCase";
import ProviderHome from "./pages/ProviderHome";
import ProviderProfile from "./pages/ProviderProfile";
import ProfileSetup from "./pages/ProfileSetup";
import CaseDetail from "./pages/CaseDetail";
import Messages from "./pages/Messages";

import "./styles/global.css";

export const AuthContext = React.createContext(null);

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) setUserRole(snap.data().role);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      // Hide the HTML splash screen once auth state is known
      if (window.__hideSplash) window.__hideSplash();
    });
    return unsub;
  }, []);

  // While waiting for Firebase auth — show nothing (splash is still visible in HTML)
  if (user === undefined) return null;

  return (
    <AuthContext.Provider value={{ user, userRole }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={!user ? <Login />    : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          {/* Home — routes by role */}
          <Route
            path="/"
            element={
              !user ? <Navigate to="/login" /> :
              userRole === "provider" ? <ProviderHome /> :
              <ClientHome />
            }
          />

          {/* Protected routes */}
          <Route path="/post-case"      element={user ? <PostCase />      : <Navigate to="/login" />} />
          <Route path="/profile-setup"  element={user ? <ProfileSetup />  : <Navigate to="/login" />} />
          <Route path="/provider/:id"   element={user ? <ProviderProfile />: <Navigate to="/login" />} />
          <Route path="/case/:id"       element={user ? <CaseDetail />     : <Navigate to="/login" />} />
          <Route path="/messages"       element={user ? <Messages />       : <Navigate to="/login" />} />
          <Route path="/messages/:threadId" element={user ? <Messages />   : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

