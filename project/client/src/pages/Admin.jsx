import { useEffect, useState } from 'react';
import { fetchDocuments, uploadDocument } from '../api/client';

const DOC_TYPE_OPTIONS = ['policy', 'placement', 'syllabus', 'circular'];

const formatDocType = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export default function Admin() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState(DOC_TYPE_OPTIONS[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('File and title are required');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('docType', docType);
      formData.append('year', year);

      const data = await uploadDocument(formData);
      setMessage(data.warning || 'Document uploaded successfully');
      setTitle('');
      setFile(null);
      e.target.reset();
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page admin-page">
      <div className="page-heading">
        <div>
          <h1>Document library</h1>
          <p className="heading-copy">Add the source material used by the campus knowledge desk.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-intro">
          <div><span className="upload-symbol">+</span><div><strong>Upload a source document</strong><p>PDF, DOC, and Excel files are processed and indexed for search.</p></div></div>
          <span className="file-limit">PDF / DOC / Excel · 25 MB max</span>
        </div>
        <div className="form-row">
          <label>File</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div className="form-row">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leave Policy 2024"
          />
        </div>

        <div className="form-row">
          <label>Doc Type</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {formatDocType(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Year</label>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>

        <button className="primary-button" type="submit" disabled={uploading}>
          {uploading ? 'Indexing...' : 'Upload and index'}
        </button>
      </form>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="section-heading"><h2>Existing documents</h2></div>
      <table className="documents-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Year</th>
            <th>Status</th>
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc._id}>
              <td>{doc.title}</td>
              <td>{formatDocType(doc.docType)}</td>
              <td>{doc.year}</td>
              <td>{doc.status}</td>
              <td>{new Date(doc.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
