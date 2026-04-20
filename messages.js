// src/pages/Messages.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, getDoc, where, getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../App";

export default function Messages() {
  const { threadId } = useParams();
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all threads for current user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "threads"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (threadId) {
    return <ChatView threadId={threadId} />;
  }

  return (
    <div className="page">
      <div className="topbar">
        <Link to="/" style={{ color: "var(--ink)", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 16L7 10l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="topbar-logo" style={{ fontSize: 20 }}>Messages</div>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ padding: "16px 0" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No messages yet</div>
            <div className="empty-state-sub">When you connect with a provider or client, your conversation will appear here.</div>
          </div>
        ) : (
          threads.map(thread => <ThreadRow key={thread.id} thread={thread} currentUser={user} />)
        )}
      </div>
    </div>
  );
}

function ThreadRow({ thread, currentUser }) {
  const otherName = thread.participantNames?.find((_, i) => thread.participants[i] !== currentUser.uid) || "Unknown";
  const otherId = thread.participants?.find(id => id !== currentUser.uid);

  return (
    <Link to={`/messages/${thread.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 22px",
        borderBottom: "1px solid var(--border)",
        transition: "background .15s"
      }}>
        <div className="avatar avatar-md" style={{ fontSize: 16 }}>
          {otherName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>{otherName}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {thread.lastMessage || "Start the conversation…"}
          </div>
        </div>
        {thread.lastMessageAt && (
          <div style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
            {new Date(thread.lastMessageAt?.toDate?.()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}
      </div>
    </Link>
  );
}

function ChatView({ threadId }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Ensure thread doc exists and get other participant info
  useEffect(() => {
    if (!user) return;
    const parts = threadId.split("_");
    const otherId = parts.find(id => id !== user.uid);
    if (!otherId) return;

    // Get other user name
    getDoc(doc(db, "users", otherId)).then(snap => {
      if (snap.exists()) setOtherUser(snap.data());
    });

    // Create thread if doesn't exist
    const threadRef = doc(db, "threads", threadId);
    getDoc(threadRef).then(snap => {
      if (!snap.exists()) {
        setDoc(threadRef, {
          participants: [user.uid, otherId],
          participantNames: [],
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
    });
  }, [threadId, user]);

  // Real-time messages
  useEffect(() => {
    const q = query(
      collection(db, "threads", threadId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return unsub;
  }, [threadId]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "threads", threadId, "messages"), {
        text: msgText,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp()
      });
      // Update thread metadata
      await setDoc(doc(db, "threads", threadId), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp()
      }, { merge: true });
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Chat header */}
      <div className="topbar">
        <Link to="/messages" style={{ color: "var(--ink)", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 16L7 10l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar avatar-sm" style={{ fontSize: 12 }}>
            {(otherUser?.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{otherUser?.name || "Loading…"}</div>
        </div>
        <div style={{ width: 20 }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>Start your conversation with {otherUser?.name?.split(" ")[0] || "this person"}</div>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.senderId === user.uid;
          return (
            <div key={m.id} style={{
              display: "flex",
              justifyContent: isMe ? "flex-end" : "flex-start",
              marginBottom: 10
            }}>
              <div style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isMe ? "var(--sage)" : "var(--white)",
                border: isMe ? "none" : "1.5px solid var(--border)",
                color: isMe ? "white" : "var(--ink)",
                fontSize: 14,
                lineHeight: 1.5
              }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 32px",
        background: "var(--white)",
        borderTop: "1.5px solid var(--border)",
        display: "flex",
        gap: 10,
        alignItems: "flex-end"
      }}>
        <textarea
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 12,
            border: "1.5px solid var(--border)",
            background: "var(--paper)",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            resize: "none",
            maxHeight: 120,
            lineHeight: 1.5,
            color: "var(--ink)"
          }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: text.trim() ? "var(--sage)" : "var(--border)",
            border: "none",
            cursor: text.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .2s",
            flexShrink: 0
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15 3L3 8l5 2 2 5 5-12z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

