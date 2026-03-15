'use client'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1', marginBottom: '8px' }}>ExamPrep</p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Critical Error</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}
          >
            Reload Page
          </button>
          <details style={{ textAlign: 'left', marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '12px' }}>Error Details</summary>
            <pre style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        </div>
      </body>
    </html>
  )
}
