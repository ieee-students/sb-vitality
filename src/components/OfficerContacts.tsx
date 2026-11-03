import { Fragment, useEffect, useRef, useState } from "react";
import type { OfficerContactSummary } from "../domain/types";

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to execCommand below if clipboard API permission is denied.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    return typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export function OfficerContacts({
  contacts,
  scopeTitle,
}: {
  contacts: OfficerContactSummary;
  scopeTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCopied(false);
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [contacts.commaSeparated]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(contacts.commaSeparated);
    if (!ok) return;
    setCopied(true);
    if (timerRef.current != null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, 2000);
  };

  return (
    <div className="officer-contacts">
      <div className="officer-contacts-head">
        <h2>{contacts.heading}</h2>
        {contacts.allEmails.length > 0 ? (
          <div className="officer-contacts-actions">
            <span className="copy-status" role="status" aria-live="polite">
              {copied ? "Copied" : ""}
            </span>
            <button
              type="button"
              className={`copy-emails-btn${copied ? " is-copied" : ""}`}
              onClick={handleCopy}
              aria-label={`Copy all ${contacts.heading.toLowerCase()} emails for ${scopeTitle}`}
              title="Copy all emails (comma-separated)"
            >
              {copied ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6.5" y="2.75" width="7" height="3" rx="1" />
                  <path d="M6.5 4.25H5.25A1.75 1.75 0 0 0 3.5 6v10.25c0 .966.784 1.75 1.75 1.75h9.5a1.75 1.75 0 0 0 1.75-1.75V6a1.75 1.75 0 0 0-1.75-1.75H13.5" />
                </svg>
              )}
            </button>
          </div>
        ) : null}
      </div>
      <dl className="officer-email-list">
        {contacts.roles.map((role) => (
          <div key={role.key} className="officer-email-row">
            <dt>{role.label}</dt>
            <dd>
              {role.emails.length === 0 ? (
                <span className="officer-email-missing">Not reported</span>
              ) : (
                role.emails.map((email, index) => (
                  <Fragment key={email}>
                    {index > 0 ? ", " : null}
                    <a href={`mailto:${email}`}>{email}</a>
                  </Fragment>
                ))
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

