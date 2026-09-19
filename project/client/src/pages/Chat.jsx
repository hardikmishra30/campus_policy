import { useState } from 'react';
import { sendChatQuery } from '../api/client';

const DOC_TYPE_OPTIONS = ['Policy', 'Placement', 'Syllabus', 'Circular'];
const YEAR_OPTIONS = [2021, 2022, 2023, 2024, 2025, 2026];

function FormattedAnswer({ text }) {
  const lines = text
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\|?[-\s|]+\|?$/.test(line));

  return (
    <div className="formatted-answer">
      {lines.map((line, index) => {
        const isBullet = /^(?:[-*•]|\d+[.)])\s+/.test(line);
        const content = line.replace(/^(?:[-*•]|\d+[.)])\s+/, '');

        return (
          <p key={`${index}-${line}`} className={isBullet ? 'answer-bullet' : ''}>
            {isBullet && <span className="bullet-marker">•</span>}
            {formatInlineText(content)}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function Chat() {
  const [query, setQuery] = useState('');
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDocType = (type) => {
    setSelectedDocTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleAsk = async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError('');

    try {
      const filters = {
        docType: selectedDocTypes,
        year: selectedYears,
      };
      const data = await sendChatQuery(trimmed, filters);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.answer, citations: data.citations || [] },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Sorry, I could not get an answer. Please try again.',
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="page chat-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Campus knowledge desk</p>
          <h1>Ask about campus policies & placements</h1>
          <p className="heading-copy">Search approved campus documents and receive answers with source references.</p>
        </div>
        <span className="status-label"><span /> RAG service online</span>
      </div>

      <div className="chat-layout">
        <aside className="filter-panel">
          <div className="panel-title">
            <span>Search scope</span>
            <small>OPTIONAL</small>
          </div>
          <p className="panel-copy">Narrow your answer to specific document groups or academic years.</p>

          <div className="filter-section">
            <span className="section-label">Document type</span>
            {DOC_TYPE_OPTIONS.map((type) => (
              <label key={type} className="checkbox-label">
                <input type="checkbox" checked={selectedDocTypes.includes(type)} onChange={() => toggleDocType(type)} />
                <span>{type}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <span className="section-label">Academic year</span>
            {YEAR_OPTIONS.map((year) => (
              <label key={year} className="checkbox-label">
                <input type="checkbox" checked={selectedYears.includes(year)} onChange={() => toggleYear(year)} />
                <span>{year}</span>
              </label>
            ))}
          </div>
        </aside>

        <section className="chat-column">
          <div className="chat-window">
            {messages.length === 0 && (
              <div className="empty-state">
                <span className="empty-mark">?</span>
                <strong>What would you like to know?</strong>
                <p>Ask about eligibility, placement rules, policies, academic calendars, and more.</p>
                <div className="suggestion-row">
                  <button type="button" onClick={() => setQuery('What is the eligibility criteria for placement?')}>Placement eligibility</button>
                  <button type="button" onClick={() => setQuery('What are the current placement rules?')}>Placement rules</button>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === 'bot' ? <FormattedAnswer text={msg.text} /> : <p>{msg.text}</p>}
                  {msg.role === 'bot' && msg.citations && msg.citations.length > 0 && (
                    <div className="citations">
                      <strong>Sources</strong>
                      <ul>{msg.citations.map((c, i) => <li key={i}>{c.docTitle} {c.section ? `- ${c.section}` : ''} {c.page ? `(p. ${c.page})` : ''}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="message bot"><div className="message-bubble">Searching campus documents...</div></div>}
          </div>

          {error && <p className="error-text">{error}</p>}
          <div className="chat-input-row">
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question about campus documents..." rows={3} />
            <button onClick={handleAsk} disabled={loading || !query.trim()}>Ask <span>→</span></button>
          </div>
          <p className="input-note">Answers are generated from your uploaded documents and may require verification.</p>
        </section>
      </div>
    </div>
  );
}
