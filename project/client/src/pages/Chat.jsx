import { useState } from 'react';
import { sendChatQuery } from '../api/client';

const DOC_TYPE_OPTIONS = ['policy', 'placement', 'syllabus', 'circular'];
const YEAR_OPTIONS = [2021, 2022, 2023, 2024, 2025, 2026];

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
      <h2>Ask about campus policies & placements</h2>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Doc Type:</span>
          {DOC_TYPE_OPTIONS.map((type) => (
            <label key={type} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedDocTypes.includes(type)}
                onChange={() => toggleDocType(type)}
              />
              {type}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <span className="filter-label">Year:</span>
          {YEAR_OPTIONS.map((year) => (
            <label key={year} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => toggleYear(year)}
              />
              {year}
            </label>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {messages.length === 0 && (
          <p className="empty-state">Ask a question to get started.</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-bubble">
              <p>{msg.text}</p>
              {msg.role === 'bot' && msg.citations && msg.citations.length > 0 && (
                <div className="citations">
                  <strong>Sources:</strong>
                  <ul>
                    {msg.citations.map((c, i) => (
                      <li key={i}>
                        {c.docTitle} {c.section ? `— ${c.section}` : ''}{' '}
                        {c.page ? `(p. ${c.page})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-bubble">Thinking...</div>
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="chat-input-row">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          rows={3}
        />
        <button onClick={handleAsk} disabled={loading || !query.trim()}>
          Ask
        </button>
      </div>
    </div>
  );
}
