import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";
import { stackApp } from "../lib/stack";

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useUser();

  const handleGetStarted = async () => {
    if (user) {
      navigate("/home");
    } else {
      await stackApp.redirectToSignIn();
    }
  };

  return (
    <div className="landing-root">
      <nav className="landing-nav">
        <a className="landing-logo" href="/">
          <div className="landing-logo-icon">D</div>
          DocuMind
        </a>
        <div className="landing-nav-actions">
          {user ? (
            <button className="btn-primary" onClick={() => navigate("/home")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                className="btn-ghost"
                onClick={() => stackApp.redirectToSignIn()}
              >
                Sign in
              </button>
              <button className="btn-primary" onClick={handleGetStarted}>
                Get started free
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-badge">
          <span>✦</span>
          AI-powered document intelligence
        </div>

        <h1 className="hero-title">
          Transform documents
          <br />
          into{" "}
          <span className="hero-title-accent">actionable intelligence</span>
        </h1>

        <p className="hero-subtitle">
          Upload any PDF and instantly extract insights, answer questions, and
          integrate with your workflows. Built for teams who move fast.
        </p>

        <div className="hero-actions">
          <button className="btn-primary-lg" onClick={handleGetStarted}>
            Start for free →
          </button>
          <button className="btn-outline-lg">See how it works</button>
        </div>

        <p className="hero-social-proof">
          No credit card required · Enterprise SSO available · SOC 2 compliant
        </p>
      </section>

      <section className="landing-features">
        <p className="section-label">Capabilities</p>
        <h2 className="section-title">Everything your team needs</h2>
        <p className="section-subtitle">
          From one-off document Q&A to automated data extraction pipelines —
          DocuMind scales with your use case.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <div className="feature-title">Instant Q&A</div>
            <p className="feature-desc">
              Ask questions in plain language. Get precise answers backed by
              direct quotes from the source document — not hallucinations.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Structured extraction</div>
            <p className="feature-desc">
              Pull tables, clauses, entities, and key fields into structured
              JSON. Feed them directly into your database or downstream systems.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <div className="feature-title">Workflow integrations</div>
            <p className="feature-desc">
              Trigger automations via REST API, Zapier, or Make. Connect
              DocuMind to your CRM, ERP, or custom pipeline in minutes.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Enterprise-grade security</div>
            <p className="feature-desc">
              Documents are encrypted at rest and in transit. Role-based access
              controls keep sensitive data visible only to the right people.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Multi-document analysis</div>
            <p className="feature-desc">
              Compare contracts, cross-reference reports, and identify patterns
              across a corpus — not just a single file.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <div className="feature-title">Memory across sessions</div>
            <p className="feature-desc">
              Pick up where you left off. Conversation history is preserved per
              document so context is never lost between sessions.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-how">
        <p className="section-label">How it works</p>
        <h2 className="section-title">Up and running in 3 steps</h2>
        <p className="section-subtitle">
          No setup, no configuration. Just upload and start extracting value.
        </p>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-title">Upload your document</div>
            <p className="step-desc">
              Drag and drop any PDF. DocuMind processes it in seconds — indexing
              every paragraph, table, and section.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-title">Ask or extract</div>
            <p className="step-desc">
              Chat with the document or define extraction templates. Get answers
              with citations or structured output ready to use.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-title">Integrate & automate</div>
            <p className="step-desc">
              Push results to your stack via API. Build automated pipelines that
              process incoming documents without manual intervention.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-integrations">
        <p className="integrations-label">Integrates with your stack</p>
        <div className="integrations-list">
          <span className="integration-item">Zapier</span>
          <span className="integration-item">Make</span>
          <span className="integration-item">REST API</span>
          <span className="integration-item">Webhooks</span>
          <span className="integration-item">Salesforce</span>
          <span className="integration-item">Slack</span>
          <span className="integration-item">Notion</span>
        </div>
      </section>

      <footer className="landing-footer">
        © 2025 DocuMind. Built for teams who move fast.
      </footer>
    </div>
  );
}
