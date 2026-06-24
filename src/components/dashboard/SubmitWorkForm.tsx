"use client";

import { useState } from "react";

export function SubmitWorkForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (notes: string) => void;
  submitting?: boolean;
}) {
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!notes.trim()) return;
        onSubmit(notes.trim());
      }}
    >
      <div className="field">
        <label htmlFor="submission-notes">Submission notes</label>
        <textarea
          id="submission-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what you did and paste links to your work…"
          required
        />
      </div>
      <div className="field">
        <label>Attachment</label>
        <input type="file" disabled />
        <p className="text-xs text-zinc-400">File uploads coming soon.</p>
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
