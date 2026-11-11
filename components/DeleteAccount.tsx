"use client";

import { useState } from "react";

export function DeleteAccount({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn border border-amber bg-amber-soft text-[#7a5305]"
      >
        Delete my data
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber/50 bg-amber-soft p-4">
      <p className="text-sm font-semibold">Delete everything? This cannot be undone.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={action}>
          <button
            type="submit"
            className="btn bg-[#8d3c2b] text-white hover:bg-[#742f21]"
          >
            Yes, delete everything
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-ghost bg-white"
        >
          Keep my account
        </button>
      </div>
    </div>
  );
}
