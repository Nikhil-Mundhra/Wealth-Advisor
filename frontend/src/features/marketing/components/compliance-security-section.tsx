import { CheckCircle2, EyeOff, FileKey, Fingerprint, Lock, ShieldCheck, UserX } from 'lucide-react';

export function ComplianceSecuritySection() {
  return (
    <section id="compliance" className="py-20 sm:py-28 bg-surface-subtle/40 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-600">
            <ShieldCheck className="size-3.5" />
            <span>Pillar 4 · Compliance, Guardrails & Trust</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Institutional Trust & <br />
            <span className="text-brand-700 dark:text-brand-600">Zero-Compromise Fiduciary Compliance</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            In wealth management, compliance isn't a post-launch checklist—it's the primary market gatekeeper.
            Syntropy AI is engineered from the ground up with formal neuro-symbolic guardrails and verifiable audit trails.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Demographic Bias Guardrails */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
              <UserX className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Demographic Bias Mitigation</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Removes non-financial gender and phrasing markers before utility optimization. Enforces standardized
              academic glidepaths so women and non-finance users receive equal compounding equity allocations.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              Eliminates the $50,000–$100,000 retirement wealth penalty identified by MIT Sloan.
            </div>
          </div>

          {/* Card 2: Immutable Audit Trails */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
              <FileKey className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Immutable Cryptographic Audit Trails</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Every prompt, retrieved context, deterministic tool call, and generated response is
              hashed into a tamper-evident SHA-256 verifiable ledger providing complete audit transparency.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              Full transparency for internal compliance officers and supervisory oversight.
            </div>
          </div>

          {/* Card 3: Zero Data Training */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-gold-subtle text-gold">
              <Lock className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Zero Model Training & PII Redaction</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Client financial statements, tax records, and account balances are processed via isolated enterprise
              endpoints. Client data is strictly never retained or used to train public or foundation models.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              Perimeter PII scrubbing for names, identifiers, account numbers, and addresses.
            </div>
          </div>

          {/* Card 4: Configurable Recording Modes */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
              <EyeOff className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Configurable Supervision Modes</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Advisors can toggle recording modes on a per-firm or per-client basis: audio-free transcript only,
              encrypted structured summary, or complete compliant audio capture with dual-party consent.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              Architected for enterprise supervisory compliance and consent workflows.
            </div>
          </div>

          {/* Card 5: Output Guardrail Engine */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Output Guardrail Layer</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Pre-flight regex and semantic guardrails automatically intercept and block promissory return statements
              ("guaranteed 10% returns") and unauthorized product recommendations before clients see them.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              Deterministic calculation shield ensuring zero ungrounded financial figures.
            </div>
          </div>

          {/* Card 6: Biometric Execution Signoff */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-control bg-gold-subtle text-gold">
              <Fingerprint className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">Biometric Step-Up Verification</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Automated rebalance proposals require explicit human-in-the-loop authorization. Users and advisors
              sign sandbox and production rebalances using WebAuthn / Passkey hardware biometrics.
            </p>
            <div className="mt-4 rounded-control bg-surface-subtle p-3 text-[11px] text-subtle border border-line">
              FIDO2 standard cryptographic proof of intention before trade staging.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
