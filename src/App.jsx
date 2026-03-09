import { useState, useEffect, useRef } from "react";

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

const CLIENTS_INIT = [
  {
    id: 1,
    name: "Phil Steinberg",
    role: "Criminal Defense Attorney",
    firm: "Steinberg & Associates",
    location: "Philadelphia, PA",
    avatar: "PS",
    color: "#1a1a2e",
    accent: "#c9a227",
    platforms: ["Instagram", "Facebook", "TikTok", "X"],
    niche: "Criminal Defense / Full-Service Law",
    tone: "Stoic, confident, quietly powerful. Never flashy or salesy.",
    contentMix: [
      "Video testimonials from past clients",
      "Motivational quotes on perseverance & justice",
      "Client quote posts",
      "Behind-the-scenes moments (human side, no softening)"
    ],
    guardrails: [
      "No legal jargon that alienates regular people",
      "No promises about case outcomes",
      "Must comply with Pennsylvania Bar advertising rules",
      "Never sound like a loud lawyer ad"
    ],
    schedule: [
      { day: "Mon", time: "8:00 AM", platform: "Instagram", type: "Motivational Quote" },
      { day: "Mon", time: "12:00 PM", platform: "Facebook", type: "Client Testimonial" },
      { day: "Tue", time: "9:00 AM", platform: "TikTok", type: "Short-form Video" },
      { day: "Wed", time: "8:00 AM", platform: "X", type: "Industry Insight" },
      { day: "Wed", time: "5:00 PM", platform: "Instagram", type: "Behind the Scenes" },
      { day: "Thu", time: "10:00 AM", platform: "Facebook", type: "Client Quote Post" },
      { day: "Fri", time: "8:00 AM", platform: "Instagram", type: "Motivational Quote" },
      { day: "Fri", time: "2:00 PM", platform: "TikTok", type: "Case Study (anonymized)" },
    ],
    analytics: {
      followers: 12400,
      growth: "+4.2%",
      engagement: "6.8%",
      topPlatform: "Instagram",
      topContent: "Video Testimonials",
      weeklyPosts: 8,
      reach: "34.2K"
    },
    generatedContent: [],
    status: "active"
  }
];

const EMPTY_CLIENT = {
  name: "",
  role: "",
  firm: "",
  location: "",
  platforms: [],
  niche: "",
  tone: "",
  contentMix: [],
  guardrails: [],
  schedule: [],
  analytics: { followers: 0, growth: "0%", engagement: "0%", topPlatform: "-", topContent: "-", weeklyPosts: 0, reach: "0" },
  generatedContent: [],
  status: "active"
};

const PLATFORM_COLORS = {
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  TikTok: "#010101",
  X: "#14171A",
  LinkedIn: "#0A66C2",
  YouTube: "#FF0000"
};

const PLATFORM_ICONS = {
  Instagram: "◉",
  Facebook: "f",
  TikTok: "♪",
  X: "𝕏",
  LinkedIn: "in",
  YouTube: "▶"
};

const CONTENT_TYPES = [
  "Motivational Quote",
  "Client Testimonial",
  "Client Quote Post",
  "Behind the Scenes",
  "Industry Insight",
  "Short-form Video Concept",
  "Case Study (anonymized)",
  "Educational Post"
];

// ─── Claude API Call ───
async function generateWithClaude(client, contentType, platform) {
  const systemPrompt = `You are a social media content strategist for ${client.name}, ${client.role} at ${client.firm} in ${client.location}.

NICHE: ${client.niche}

BRAND VOICE: ${client.tone}

CONTENT MIX: ${client.contentMix.join(", ")}

GUARDRAILS — NEVER VIOLATE:
${client.guardrails.map(g => `- ${g}`).join("\n")}

You create social media posts that are ready to publish. Every post should reinforce that ${client.name} is the person you call when it matters most.

Rules:
- Write the actual post copy, not a description of what to post
- Include relevant emoji sparingly — never overdo it
- If it's a video concept, write the script/voiceover and visual direction
- Match the platform's native style (Instagram = visual storytelling, X = punchy and sharp, TikTok = hook-first, Facebook = slightly longer form)
- Never use hashtags unless specifically asked
- Sound human, not like AI or marketing copy`;

  const userPrompt = `Create a ${contentType} post for ${platform}. Give me just the post — no preamble, no explanation, no options. One post, ready to go.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

// ─── Stat Card ───
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      padding: "16px 18px",
      minWidth: 130,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || "#fff", fontFamily: "'Playfair Display', serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: sub.startsWith("+") ? "#4ade80" : "rgba(255,255,255,0.35)", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
    </div>
  );
}

// ─── Schedule Row ───
function ScheduleRow({ item, accent }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
      marginBottom: 6,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: PLATFORM_COLORS[item.platform] || "#333",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontWeight: 700
      }}>
        {PLATFORM_ICONS[item.platform] || "•"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{item.type}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.platform}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{item.day}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.time}</div>
      </div>
    </div>
  );
}

// ─── Content Generator (REAL AI) ───
function ContentGenerator({ client }) {
  const [selectedType, setSelectedType] = useState("Motivational Quote");
  const [selectedPlatform, setSelectedPlatform] = useState(client.platforms[0] || "Instagram");
  const [generated, setGenerated] = useState([]);
  const [approved, setApproved] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await generateWithClaude(client, selectedType, selectedPlatform);
      setGenerated(prev => [{ text: content, type: selectedType, platform: selectedPlatform, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const startEdit = (idx, text) => {
    setEditingIdx(idx);
    setEditText(text);
  };

  const saveEdit = (idx) => {
    setGenerated(prev => prev.map((item, i) => i === idx ? { ...item, text: editText } : item));
    setEditingIdx(null);
    setEditText("");
  };

  return (
    <div>
      {/* Content Type Selection */}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>Content Type</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CONTENT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: selectedType === type ? `1px solid ${client.accent}` : "1px solid rgba(255,255,255,0.08)",
              background: selectedType === type ? `${client.accent}22` : "transparent",
              color: selectedType === type ? client.accent : "rgba(255,255,255,0.5)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s"
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Platform Selection */}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>Platform</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {client.platforms.map(p => (
          <button
            key={p}
            onClick={() => setSelectedPlatform(p)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: selectedPlatform === p ? `1px solid ${PLATFORM_COLORS[p]}` : "1px solid rgba(255,255,255,0.08)",
              background: selectedPlatform === p ? `${PLATFORM_COLORS[p]}22` : "transparent",
              color: selectedPlatform === p ? PLATFORM_COLORS[p] : "rgba(255,255,255,0.4)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[p]}</span> {p}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={loading}
        style={{
          padding: "12px 28px",
          borderRadius: 8,
          border: "none",
          background: loading ? "rgba(255,255,255,0.1)" : client.accent,
          color: loading ? "rgba(255,255,255,0.4)" : client.color,
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>⟳</span>
            Agent is thinking...
          </>
        ) : (
          <>⚡ Generate with AI</>
        )}
      </button>

      {/* API Status */}
      {!CLAUDE_API_KEY && (
        <div style={{
          padding: 14, borderRadius: 10,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          marginBottom: 16, fontSize: 12, color: "#ef4444",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          ⚠️ No API key detected. Add VITE_CLAUDE_API_KEY to your .env file and restart the dev server.
        </div>
      )}

      {error && (
        <div style={{
          padding: 14, borderRadius: 10,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          marginBottom: 16, fontSize: 12, color: "#ef4444",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Generated Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {generated.map((item, i) => (
          <div key={i} style={{
            padding: 20,
            borderRadius: 12,
            background: approved[i] ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.03)",
            border: approved[i] ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {/* Meta info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                padding: "3px 10px", borderRadius: 12,
                background: `${PLATFORM_COLORS[item.platform]}22`,
                border: `1px solid ${PLATFORM_COLORS[item.platform]}33`,
                fontSize: 10, color: PLATFORM_COLORS[item.platform], fontWeight: 600
              }}>
                {item.platform}
              </div>
              <div style={{
                padding: "3px 10px", borderRadius: 12,
                background: `${client.accent}15`,
                border: `1px solid ${client.accent}25`,
                fontSize: 10, color: client.accent, fontWeight: 600
              }}>
                {item.type}
              </div>
              <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                {item.timestamp}
              </div>
            </div>

            {/* Content */}
            {editingIdx === i ? (
              <div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width: "100%", minHeight: 120, padding: 14, borderRadius: 8,
                    border: `1px solid ${client.accent}44`, background: "rgba(255,255,255,0.04)",
                    color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => saveEdit(i)} style={{
                    padding: "6px 16px", borderRadius: 6, border: "none",
                    background: client.accent, color: client.color,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}>Save</button>
                  <button onClick={() => setEditingIdx(null)} style={{
                    padding: "6px 16px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                    color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 14,
                whiteSpace: "pre-wrap"
              }}>
                {item.text}
              </div>
            )}

            {/* Actions */}
            {editingIdx !== i && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setApproved(prev => ({ ...prev, [i]: !prev[i] }))}
                  style={{
                    padding: "6px 18px", borderRadius: 6, border: "none",
                    background: approved[i] ? "#4ade80" : "rgba(74,222,128,0.15)",
                    color: approved[i] ? "#000" : "#4ade80",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  {approved[i] ? "✓ Approved" : "Approve"}
                </button>
                <button
                  onClick={() => startEdit(i, item.text)}
                  style={{
                    padding: "6px 18px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                    color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(item.text); }}
                  style={{
                    padding: "6px 18px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                    color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setGenerated(prev => prev.filter((_, idx) => idx !== i))}
                  style={{
                    padding: "6px 18px", borderRadius: 6,
                    border: "1px solid rgba(239,68,68,0.2)", background: "transparent",
                    color: "rgba(239,68,68,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Add Client Modal ───
function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ ...EMPTY_CLIENT, contentMix: [""], guardrails: [""] });
  const allPlatforms = ["Instagram", "Facebook", "TikTok", "X", "LinkedIn", "YouTube"];

  const togglePlatform = (p) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p]
    }));
  };

  const updateList = (field, idx, val) => {
    setForm(prev => {
      const arr = [...prev[field]];
      arr[idx] = val;
      return { ...prev, [field]: arr };
    });
  };

  const addListItem = (field) => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const initials = form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#1a2e1a", "#2e1a1a", "#1a1a2e", "#2e2a1a", "#1a2a2e"];
    const accents = ["#27c9a2", "#c92727", "#c9a227", "#a227c9", "#2780c9"];
    const idx = Math.floor(Math.random() * colors.length);
    onAdd({
      ...form,
      id: Date.now(),
      avatar: initials,
      color: colors[idx],
      accent: accents[idx],
      contentMix: form.contentMix.filter(x => x.trim()),
      guardrails: form.guardrails.filter(x => x.trim()),
      generatedContent: [],
      schedule: [],
      analytics: { followers: 0, growth: "0%", engagement: "0%", topPlatform: "-", topContent: "-", weeklyPosts: 0, reach: "0" }
    });
  };

  const labelStyle = { fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" };
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#111116", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
        padding: 32, width: "90%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 22 }}>New Client Agent</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={labelStyle}>Client Name</div>
            <input style={inputStyle} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Phil Steinberg" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Role / Title</div>
              <input style={inputStyle} value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))} placeholder="e.g. Criminal Defense Attorney" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Firm / Company</div>
              <input style={inputStyle} value={form.firm} onChange={e => setForm(prev => ({ ...prev, firm: e.target.value }))} placeholder="e.g. Steinberg & Associates" />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Location</div>
            <input style={inputStyle} value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g. Philadelphia, PA" />
          </div>
          <div>
            <div style={labelStyle}>Niche / Industry</div>
            <input style={inputStyle} value={form.niche} onChange={e => setForm(prev => ({ ...prev, niche: e.target.value }))} placeholder="e.g. Criminal Defense / Full-Service Law" />
          </div>
          <div>
            <div style={labelStyle}>Brand Tone & Voice</div>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.tone} onChange={e => setForm(prev => ({ ...prev, tone: e.target.value }))} placeholder="Describe how this client should sound on social media..." />
          </div>
          <div>
            <div style={labelStyle}>Platforms</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allPlatforms.map(p => (
                <button key={p} onClick={() => togglePlatform(p)} style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  border: form.platforms.includes(p) ? `1px solid ${PLATFORM_COLORS[p]}` : "1px solid rgba(255,255,255,0.08)",
                  background: form.platforms.includes(p) ? `${PLATFORM_COLORS[p]}22` : "transparent",
                  color: form.platforms.includes(p) ? PLATFORM_COLORS[p] : "rgba(255,255,255,0.4)",
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif"
                }}>
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Content Types</div>
            {form.contentMix.map((item, i) => (
              <input key={i} style={{ ...inputStyle, marginBottom: 6 }} value={item} onChange={e => updateList("contentMix", i, e.target.value)} placeholder="e.g. Video testimonials, Quote posts..." />
            ))}
            <button onClick={() => addListItem("contentMix")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add content type</button>
          </div>
          <div>
            <div style={labelStyle}>Guardrails (What the agent must NEVER do)</div>
            {form.guardrails.map((item, i) => (
              <input key={i} style={{ ...inputStyle, marginBottom: 6 }} value={item} onChange={e => updateList("guardrails", i, e.target.value)} placeholder="e.g. Never promise specific outcomes..." />
            ))}
            <button onClick={() => addListItem("guardrails")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add guardrail</button>
          </div>
          <button onClick={submit} style={{
            padding: "12px 24px", borderRadius: 10, border: "none",
            background: "#fff", color: "#000", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 8
          }}>
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───
export default function AgencyDashboard() {
  const [clients, setClients] = useState(CLIENTS_INIT);
  const [activeClient, setActiveClient] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddClient, setShowAddClient] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const client = clients[activeClient];
  const tabs = ["overview", "content", "schedule", "agent"];

  const addClient = (newClient) => {
    setClients(prev => [...prev, newClient]);
    setShowAddClient(false);
    setActiveClient(clients.length);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex"
    }}>
      {/* ─── Sidebar ─── */}
      <div style={{
        width: 260,
        minWidth: 260,
        background: "#08080d",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0
      }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
            Command
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 3, marginTop: 2 }}>Agency Dashboard</div>
        </div>

        <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 2, padding: "16px 8px 8px", fontWeight: 700 }}>Clients</div>
          {clients.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { setActiveClient(i); setActiveTab("overview"); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: activeClient === i ? "rgba(255,255,255,0.06)" : "transparent",
                cursor: "pointer",
                marginBottom: 2,
                transition: "all 0.15s"
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${c.accent}44, ${c.accent}11)`,
                border: `1px solid ${c.accent}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: c.accent, fontFamily: "'DM Sans', sans-serif"
              }}>
                {c.avatar}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, color: activeClient === i ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{c.platforms.length} platforms</div>
              </div>
              <div style={{
                marginLeft: "auto",
                width: 7, height: 7, borderRadius: "50%",
                background: c.status === "active" ? "#4ade80" : "#666"
              }} />
            </button>
          ))}
          <button
            onClick={() => setShowAddClient(true)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px dashed rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              cursor: "pointer",
              marginTop: 8,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s"
            }}
          >
            + Add Client
          </button>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>● AI Connected</div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#0a0a0f",
          zIndex: 10
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff"
            }}>
              {client.name}
            </h1>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
              {client.role} · {client.firm} · {client.location}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {client.platforms.map(p => (
              <div key={p} style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${PLATFORM_COLORS[p]}22`,
                border: `1px solid ${PLATFORM_COLORS[p]}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: PLATFORM_COLORS[p], fontSize: 13, fontWeight: 700
              }}>
                {PLATFORM_ICONS[p]}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "14px 20px",
                border: "none",
                borderBottom: activeTab === tab ? `2px solid ${client.accent}` : "2px solid transparent",
                background: "none",
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 32 }}>
          {activeTab === "overview" && (
            <div>
              <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
                <StatCard label="Followers" value={client.analytics.followers.toLocaleString()} sub={client.analytics.growth} accent={client.accent} />
                <StatCard label="Engagement" value={client.analytics.engagement} accent={client.accent} />
                <StatCard label="Weekly Posts" value={client.analytics.weeklyPosts} accent={client.accent} />
                <StatCard label="Reach" value={client.analytics.reach} accent={client.accent} />
              </div>

              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontWeight: 700 }}>Upcoming Schedule</div>
                  {client.schedule.slice(0, 5).map((item, i) => (
                    <ScheduleRow key={i} item={item} accent={client.accent} />
                  ))}
                  {client.schedule.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No posts scheduled yet</div>}
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontWeight: 700 }}>Brand Voice</div>
                  <div style={{
                    padding: 18, borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: 16
                  }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontStyle: "italic" }}>"{client.tone}"</div>
                  </div>

                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontWeight: 700 }}>Guardrails</div>
                  {client.guardrails.map((g, i) => (
                    <div key={i} style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: "rgba(239,68,68,0.04)",
                      border: "1px solid rgba(239,68,68,0.1)",
                      marginBottom: 6,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.55)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <span style={{ color: "#ef4444", fontSize: 10 }}>⛔</span> {g}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16, fontWeight: 700 }}>AI Content Generator — {client.name}</div>
              <ContentGenerator client={client} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16, fontWeight: 700 }}>Weekly Posting Schedule</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                  const dayItems = client.schedule.filter(s => s.day === day);
                  return (
                    <div key={day} style={{
                      padding: 18, borderRadius: 12,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: client.accent, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>{day}</div>
                      {dayItems.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>No posts scheduled</div>}
                      {dayItems.map((item, i) => (
                        <ScheduleRow key={i} item={item} accent={client.accent} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "agent" && (
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16, fontWeight: 700 }}>System Prompt — {client.name}'s Agent</div>
              <div style={{
                padding: 24, borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.7)",
                whiteSpace: "pre-wrap"
              }}>
{`You are a social media content strategist for ${client.name}, ${client.role} at ${client.firm} in ${client.location}.

NICHE: ${client.niche}

BRAND VOICE: ${client.tone}

CONTENT MIX:
${client.contentMix.map(c => `• ${c}`).join("\n")}

PLATFORMS: ${client.platforms.join(", ")}

GUARDRAILS — NEVER VIOLATE:
${client.guardrails.map(g => `⛔ ${g}`).join("\n")}

POSTING CADENCE: ${client.schedule.length} posts per week across ${client.platforms.length} platforms.

OBJECTIVE: Build trust, drive engagement, funnel traffic. Every post should reinforce that ${client.name} is the person you call when it matters most.`}
              </div>
              <div style={{
                marginTop: 16, padding: 14, borderRadius: 10,
                background: `${client.accent}08`,
                border: `1px solid ${client.accent}22`,
                fontSize: 12,
                color: "rgba(255,255,255,0.45)"
              }}>
                ℹ️ This system prompt is sent to Claude before every content generation. Edit the client profile to change it.
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} onAdd={addClient} />}
    </div>
  );
}
