import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Instagram, Sparkles, Clock, Trash2, BarChart3, Lightbulb, X, Target } from 'lucide-react';

const PILLARS = ['Educational', 'Promotional', 'Entertaining', 'Behind-the-scenes'];
const FORMATS = ['Reel', 'Carousel', 'Single Image', 'Story', 'TikTok Video', 'Long-form Video'];
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'YouTube', 'Facebook'];
const STORAGE_KEY = 'contentpulse-posts';

export default function ContentPulse() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [form, setForm] = useState({
    platform: 'Instagram',
    pillar: 'Educational',
    format: 'Reel',
    caption: '',
    postedAt: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    reach: '',
  });

  // Load saved posts from the browser's local storage on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPosts(JSON.parse(saved));
    } catch (e) {
      // First-time user or storage blocked — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  // Save posts to local storage every time they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      } catch (e) {
        // Storage full or disabled — fail silently
      }
    }
  }, [posts, loading]);

  const engagementScore = (p) => {
    const reach = Number(p.reach) || 1;
    const interactions = (Number(p.likes) || 0) + (Number(p.comments) || 0) * 3 + (Number(p.shares) || 0) * 5 + (Number(p.saves) || 0) * 4;
    return ((interactions / reach) * 100).toFixed(2);
  };

  const handleSubmit = () => {
    if (!form.caption || !form.postedAt) return;
    const newPost = { ...form, id: Date.now() };
    setPosts([newPost, ...posts]);
    setForm({ platform: 'Instagram', pillar: 'Educational', format: 'Reel', caption: '', postedAt: '', likes: '', comments: '', shares: '', saves: '', reach: '' });
    setShowForm(false);
  };

  const deletePost = (id) => setPosts(posts.filter(p => p.id !== id));

  // Analytics calculations
  const pillarStats = PILLARS.map(pillar => {
    const pillarPosts = posts.filter(p => p.pillar === pillar);
    if (pillarPosts.length === 0) return { pillar, avg: 0, count: 0 };
    const avg = pillarPosts.reduce((sum, p) => sum + Number(engagementScore(p)), 0) / pillarPosts.length;
    return { pillar, avg: avg.toFixed(2), count: pillarPosts.length };
  }).sort((a, b) => b.avg - a.avg);

  const timeStats = () => {
    const buckets = { 'Morning (5-11)': [], 'Afternoon (12-17)': [], 'Evening (18-22)': [], 'Night (23-4)': [] };
    posts.forEach(p => {
      const hour = new Date(p.postedAt).getHours();
      const score = Number(engagementScore(p));
      if (hour >= 5 && hour < 12) buckets['Morning (5-11)'].push(score);
      else if (hour >= 12 && hour < 18) buckets['Afternoon (12-17)'].push(score);
      else if (hour >= 18 && hour < 23) buckets['Evening (18-22)'].push(score);
      else buckets['Night (23-4)'].push(score);
    });
    return Object.entries(buckets).map(([time, scores]) => ({
      time,
      avg: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
      count: scores.length,
    })).sort((a, b) => b.avg - a.avg);
  };

  const sortedPosts = [...posts].sort((a, b) => Number(engagementScore(b)) - Number(engagementScore(a)));
  const topPost = sortedPosts[0];
  const worstPost = sortedPosts[sortedPosts.length - 1];

  // Ask our own backend (which talks to Claude safely) for predictions
  const generatePredictions = async () => {
    if (posts.length < 3) {
      setAiError('Add at least 3 posts first so the AI has something to work with!');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiInsight('');
    try {
      const summary = posts.map(p => ({
        platform: p.platform,
        pillar: p.pillar,
        format: p.format,
        caption: p.caption.slice(0, 120),
        score: engagementScore(p),
        hour: new Date(p.postedAt).getHours(),
      }));

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: summary }),
      });

      const data = await response.json();

      if (response.status === 503 && data.error === 'not_configured') {
        setAiError('not_configured');
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setAiInsight(data.predictions || '');
    } catch (e) {
      setAiError('Something went wrong generating ideas. Try again in a moment.');
    } finally {
      setAiLoading(false);
    }
  };

  let predictions = [];
  try {
    if (aiInsight) predictions = JSON.parse(aiInsight);
  } catch (e) {}

  if (loading) {
    return <div style={styles.loader}>Loading your content...</div>;
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #FBF7F4; }
        button { cursor: pointer; font-family: inherit; border: none; }
        input, select, textarea { font-family: inherit; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(88, 24, 40, 0.12); }
        @media (max-width: 640px) {
          .cp-app { padding: 24px 20px !important; }
          .cp-title { font-size: 48px !important; }
          .cp-header { flex-direction: column !important; align-items: flex-start !important; gap: 20px; }
          .cp-bar-row { grid-template-columns: 1fr !important; gap: 8px !important; }
          .cp-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="cp-app" style={styles.inner}>
        <header className="cp-header" style={styles.header}>
          <div>
            <div style={styles.eyebrow}>— A social pulse tracker</div>
            <h1 className="cp-title" style={styles.title}>Content<em style={styles.titleEm}>Pulse</em></h1>
            <p style={styles.subtitle}>{posts.length} {posts.length === 1 ? 'post' : 'posts'} tracked</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Log a post
          </button>
        </header>

        <nav style={styles.tabs}>
          {[
            { id: 'posts', label: 'All posts', icon: Instagram },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'predictions', label: 'AI predictions', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'posts' && (
          <div className="fade-in">
            {posts.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyNumber}>01.</div>
                <h2 style={styles.emptyTitle}>Nothing here yet</h2>
                <p style={styles.emptyText}>Log your first post and I'll start finding patterns in what's working.</p>
              </div>
            ) : (
              <div style={styles.postGrid}>
                {sortedPosts.map((post, i) => {
                  const score = engagementScore(post);
                  const isTop = post.id === topPost?.id && posts.length > 1;
                  const isWorst = post.id === worstPost?.id && posts.length > 1;
                  return (
                    <article key={post.id} style={styles.postCard} className="hover-lift">
                      <div style={styles.postHeader}>
                        <div style={styles.postRank}>#{i + 1}</div>
                        <div style={styles.postMeta}>
                          <span style={styles.postPlatform}>{post.platform}</span>
                          <span style={styles.postDot}>·</span>
                          <span>{post.format}</span>
                        </div>
                        <button onClick={() => deletePost(post.id)} style={styles.deleteBtn}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {isTop && <div style={{ ...styles.badge, ...styles.badgeTop }}><TrendingUp size={12} /> Top performer</div>}
                      {isWorst && <div style={{ ...styles.badge, ...styles.badgeBottom }}><TrendingDown size={12} /> Underperforming</div>}
                      <div style={styles.pillarTag}>{post.pillar}</div>
                      <p style={styles.caption}>{post.caption}</p>
                      <div style={styles.statsRow}>
                        <Stat label="Likes" value={post.likes} />
                        <Stat label="Comments" value={post.comments} />
                        <Stat label="Shares" value={post.shares} />
                        <Stat label="Saves" value={post.saves} />
                      </div>
                      <div style={styles.scoreBar}>
                        <div style={styles.scoreLabel}>Engagement rate</div>
                        <div style={styles.scoreValue}>{score}%</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="fade-in">
            {posts.length < 2 ? (
              <div style={styles.empty}>
                <div style={styles.emptyNumber}>02.</div>
                <h2 style={styles.emptyTitle}>Patterns need data</h2>
                <p style={styles.emptyText}>Add at least 2 posts and I'll show you which pillar is winning, best times to post, and more.</p>
              </div>
            ) : (
              <>
                <section style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Target size={18} />
                    <h2 style={styles.sectionTitle}>Pillar performance</h2>
                  </div>
                  <p style={styles.sectionSub}>Average engagement rate per content pillar</p>
                  <div style={styles.barList}>
                    {pillarStats.filter(p => p.count > 0).map((p, i) => (
                      <div key={p.pillar} className="cp-bar-row" style={styles.barRow}>
                        <div style={styles.barLabel}>
                          <span style={styles.barRank}>{i === 0 ? '★' : `0${i + 1}`}</span>
                          <span>{p.pillar}</span>
                          <span style={styles.barCount}>{p.count} posts</span>
                        </div>
                        <div style={styles.barTrack}>
                          <div style={{
                            ...styles.barFill,
                            width: `${Math.min((p.avg / (pillarStats[0].avg || 1)) * 100, 100)}%`,
                            background: i === 0 ? '#581828' : '#C8839B',
                          }} />
                        </div>
                        <div style={styles.barValue}>{p.avg}%</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Clock size={18} />
                    <h2 style={styles.sectionTitle}>Best times to post</h2>
                  </div>
                  <p style={styles.sectionSub}>When your audience actually shows up</p>
                  <div style={styles.barList}>
                    {timeStats().map((t, i) => (
                      <div key={t.time} className="cp-bar-row" style={styles.barRow}>
                        <div style={styles.barLabel}>
                          <span style={styles.barRank}>{t.count === 0 ? '—' : i === 0 ? '★' : `0${i + 1}`}</span>
                          <span>{t.time}</span>
                          <span style={styles.barCount}>{t.count} posts</span>
                        </div>
                        <div style={styles.barTrack}>
                          <div style={{
                            ...styles.barFill,
                            width: t.count === 0 ? '0%' : `${Math.min((t.avg / (timeStats()[0].avg || 1)) * 100, 100)}%`,
                            background: i === 0 && t.count > 0 ? '#581828' : '#C8839B',
                          }} />
                        </div>
                        <div style={styles.barValue}>{t.count === 0 ? 'No data' : `${t.avg}%`}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="fade-in">
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <Lightbulb size={18} />
                <h2 style={styles.sectionTitle}>What to post next</h2>
              </div>
              <p style={styles.sectionSub}>AI-generated ideas based on YOUR best-performing content</p>

              <button
                onClick={generatePredictions}
                disabled={aiLoading || posts.length < 3}
                style={{
                  ...styles.primaryBtn,
                  marginTop: 20,
                  opacity: (aiLoading || posts.length < 3) ? 0.5 : 1,
                  cursor: (aiLoading || posts.length < 3) ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={16} /> {aiLoading ? 'Thinking...' : 'Generate post ideas'}
              </button>

              {aiError === 'not_configured' && (
                <div style={styles.setupBox}>
                  <div style={styles.setupTitle}>AI predictions aren't set up yet</div>
                  <p style={styles.setupText}>
                    This feature uses the Anthropic API, which costs about $0.01 per click. To enable it:
                  </p>
                  <ol style={styles.setupList}>
                    <li>Get an API key at <strong>console.anthropic.com</strong> (add $5 in credits — lasts ages)</li>
                    <li>Go to your Vercel project → Settings → Environment Variables</li>
                    <li>Add <code style={styles.code}>ANTHROPIC_API_KEY</code> with your key as the value</li>
                    <li>Redeploy the project (Vercel does this automatically)</li>
                  </ol>
                  <p style={styles.setupFooter}>Everything else in this app works without it — keep logging posts and using analytics!</p>
                </div>
              )}

              {aiError && aiError !== 'not_configured' && <div style={styles.errorBox}>{aiError}</div>}

              {predictions.length > 0 && (
                <div style={styles.predictionGrid}>
                  {predictions.map((p, i) => (
                    <div key={i} style={styles.predictionCard} className="hover-lift">
                      <div style={styles.predictionNum}>0{i + 1}</div>
                      <div style={styles.predictionMeta}>
                        <span style={styles.predictionTag}>{p.pillar}</span>
                        <span style={styles.predictionTag}>{p.format}</span>
                        <span style={styles.predictionTag}>{p.platform}</span>
                      </div>
                      <h3 style={styles.predictionHook}>"{p.hook}"</h3>
                      <p style={styles.predictionWhy}><strong>Why it'll work:</strong> {p.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {showForm && (
          <div style={styles.modalBackdrop} onClick={() => setShowForm(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Log a post</h2>
                <button onClick={() => setShowForm(false)} style={styles.iconBtn}><X size={18} /></button>
              </div>

              <div className="cp-form-grid" style={styles.formGrid}>
                <Field label="Platform">
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} style={styles.input}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Content pillar">
                  <select value={form.pillar} onChange={(e) => setForm({ ...form, pillar: e.target.value })} style={styles.input}>
                    {PILLARS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Format">
                  <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} style={styles.input}>
                    {FORMATS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Posted at">
                  <input type="datetime-local" value={form.postedAt} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} style={styles.input} />
                </Field>
              </div>

              <Field label="Caption (first line or hook)">
                <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} style={{ ...styles.input, minHeight: 60, resize: 'vertical' }} placeholder="What was the post about?" />
              </Field>

              <div className="cp-form-grid" style={styles.formGrid}>
                <Field label="Likes"><input type="number" value={form.likes} onChange={(e) => setForm({ ...form, likes: e.target.value })} style={styles.input} placeholder="0" /></Field>
                <Field label="Comments"><input type="number" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} style={styles.input} placeholder="0" /></Field>
                <Field label="Shares"><input type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} style={styles.input} placeholder="0" /></Field>
                <Field label="Saves"><input type="number" value={form.saves} onChange={(e) => setForm({ ...form, saves: e.target.value })} style={styles.input} placeholder="0" /></Field>
              </div>

              <Field label="Reach / Views">
                <input type="number" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} style={styles.input} placeholder="How many people saw it" />
              </Field>

              <button onClick={handleSubmit} style={{ ...styles.primaryBtn, width: '100%', justifyContent: 'center', marginTop: 16 }}>
                Save post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value || 0}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  app: {
    fontFamily: "'Fraunces', Georgia, serif",
    background: '#FBF7F4',
    color: '#1a0a10',
    minHeight: '100vh',
  },
  inner: {
    padding: '40px 48px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  loader: { padding: 80, textAlign: 'center', fontFamily: "'Fraunces', serif", color: '#581828' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
    borderBottom: '1px solid #E8D5D0',
    paddingBottom: 32,
  },
  eyebrow: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#8B3A4F',
    marginBottom: 8,
  },
  title: {
    fontSize: 72,
    fontWeight: 800,
    lineHeight: 0.95,
    margin: 0,
    letterSpacing: '-0.03em',
    color: '#1a0a10',
  },
  titleEm: { fontStyle: 'italic', fontWeight: 400, color: '#581828' },
  subtitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: '#6B4048',
    marginTop: 12,
  },
  primaryBtn: {
    background: '#581828',
    color: '#FBF7F4',
    padding: '12px 20px',
    borderRadius: 2,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: "'DM Mono', monospace",
    textTransform: 'uppercase',
  },
  tabs: { display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #E8D5D0', paddingBottom: 0, flexWrap: 'wrap' },
  tab: {
    background: 'transparent',
    padding: '12px 18px',
    fontSize: 12,
    color: '#6B4048',
    fontFamily: "'DM Mono', monospace",
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  tabActive: { color: '#581828', borderBottomColor: '#581828', fontWeight: 500 },
  empty: { textAlign: 'center', padding: '80px 20px', color: '#6B4048' },
  emptyNumber: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#8B3A4F', marginBottom: 16 },
  emptyTitle: { fontSize: 36, fontWeight: 400, fontStyle: 'italic', color: '#581828', margin: '0 0 12px' },
  emptyText: { fontSize: 15, maxWidth: 400, margin: '0 auto', color: '#6B4048' },
  postGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  postCard: {
    background: '#FFFFFF',
    border: '1px solid #E8D5D0',
    borderRadius: 2,
    padding: 24,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  postRank: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B3A4F', letterSpacing: '0.1em' },
  postMeta: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6B4048', display: 'flex', gap: 6, alignItems: 'center' },
  postPlatform: { fontWeight: 500, color: '#581828' },
  postDot: { opacity: 0.4 },
  deleteBtn: { background: 'transparent', color: '#C8839B', padding: 4 },
  badge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    padding: '4px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    borderRadius: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    alignSelf: 'flex-start',
  },
  badgeTop: { background: '#581828', color: '#FBF7F4' },
  badgeBottom: { background: '#E8D5D0', color: '#8B3A4F' },
  pillarTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: '#8B3A4F',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    borderLeft: '2px solid #C8839B',
    paddingLeft: 8,
  },
  caption: { fontSize: 16, lineHeight: 1.4, color: '#1a0a10', margin: 0, fontStyle: 'italic' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 },
  stat: { textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: 600, color: '#581828' },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#6B4048', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 },
  scoreBar: {
    marginTop: 8,
    padding: '12px 0 0',
    borderTop: '1px solid #F0E0DC',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  scoreLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6B4048', textTransform: 'uppercase', letterSpacing: '0.1em' },
  scoreValue: { fontSize: 24, fontWeight: 700, color: '#581828', fontStyle: 'italic' },
  section: { marginBottom: 48 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, color: '#581828', marginBottom: 4 },
  sectionTitle: { fontSize: 32, fontWeight: 400, fontStyle: 'italic', margin: 0, color: '#1a0a10' },
  sectionSub: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6B4048', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 28 },
  barList: { display: 'flex', flexDirection: 'column', gap: 16 },
  barRow: { display: 'grid', gridTemplateColumns: '280px 1fr 80px', gap: 20, alignItems: 'center' },
  barLabel: { display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 15 },
  barRank: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#8B3A4F', minWidth: 20 },
  barCount: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6B4048', marginLeft: 'auto' },
  barTrack: { height: 6, background: '#F0E0DC', borderRadius: 1, overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },
  barValue: { fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#581828', textAlign: 'right', fontWeight: 500 },
  errorBox: { background: '#F8E8E8', color: '#8B3A4F', padding: 16, marginTop: 20, borderRadius: 2, fontSize: 14, border: '1px solid #E8D5D0' },
  setupBox: { background: '#FFFFFF', padding: '28px 32px', marginTop: 24, borderRadius: 2, border: '1px solid #E8D5D0', borderLeft: '3px solid #581828' },
  setupTitle: { fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: 'italic', color: '#581828', marginBottom: 12 },
  setupText: { fontSize: 14, color: '#1a0a10', lineHeight: 1.6, margin: '0 0 16px' },
  setupList: { fontSize: 14, color: '#1a0a10', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 16px' },
  setupFooter: { fontSize: 13, color: '#6B4048', fontStyle: 'italic', margin: 0, paddingTop: 12, borderTop: '1px solid #F0E0DC' },
  code: { fontFamily: "'DM Mono', monospace", background: '#FBF7F4', padding: '2px 6px', fontSize: 12, color: '#581828', border: '1px solid #E8D5D0' },
  predictionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 32 },
  predictionCard: {
    background: '#FFFFFF',
    border: '1px solid #E8D5D0',
    padding: 28,
    borderRadius: 2,
    position: 'relative',
  },
  predictionNum: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B3A4F', letterSpacing: '0.15em', marginBottom: 12 },
  predictionMeta: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  predictionTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    background: '#FBF7F4',
    padding: '3px 8px',
    color: '#581828',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    border: '1px solid #E8D5D0',
  },
  predictionHook: { fontSize: 20, fontStyle: 'italic', color: '#1a0a10', margin: '0 0 16px', lineHeight: 1.3, fontWeight: 400 },
  predictionWhy: { fontSize: 13, color: '#6B4048', lineHeight: 1.5, margin: 0, fontFamily: "'Fraunces', serif" },
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(26, 10, 16, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, zIndex: 100,
  },
  modal: {
    background: '#FBF7F4',
    padding: 40,
    borderRadius: 2,
    maxWidth: 640,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #E8D5D0',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 32, fontStyle: 'italic', fontWeight: 400, margin: 0, color: '#581828' },
  iconBtn: { background: 'transparent', padding: 4, color: '#6B4048' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  fieldLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: '#6B4048',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E8D5D0',
    borderRadius: 2,
    fontSize: 14,
    background: '#FFFFFF',
    color: '#1a0a10',
    outline: 'none',
    fontFamily: "'Fraunces', serif",
  },
};
