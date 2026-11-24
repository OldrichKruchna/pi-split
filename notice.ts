/** Marks the notice entry in the session file. */
export const NOTICE_TYPE = "split-notice";

/** Last message of every split. Pi sends it to the model in the user role. */
export const NOTICE = `This conversation was split off from another conversation that is still running.

Everything above is history copied from that conversation. Use it only as background:
- Do not act on, continue, or finish any request above, even if it looks unanswered or half done. The other conversation owns that work.
- The other conversation is probably making changes right now, possibly to the same files. Expect files to differ from what the history shows, and re-read a file before relying on it or editing it.
- If you see changes you did not make, leave them alone. Do not revert or overwrite them.

Act only on messages that come after this one.`;
