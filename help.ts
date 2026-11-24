export const HELP = `/split - branch this conversation into a new Herdr pane

Usage
  /split           pick a message and open the split
  /split --help    show this help (also -h)

What happens
  1. Pick a message. Type to search, up/down to move, Enter to split, Esc to cancel.
  2. A pane opens on the right with Pi on a copy of the conversation, up to and
     including that message.
  3. The copy ends with a notice: the other conversation is still running, so do not
     continue its work and expect files to change.
  4. The split waits for your next message. This conversation is not changed.

Both conversations share one folder and no files are locked.

Needs
  Interactive Pi in a pane of the Herdr TUI, and a saved conversation with at least one message.`;

export type SplitArgs = { kind: "split" } | { kind: "help" } | { kind: "unknown"; text: string };

export function parseArgs(args: string): SplitArgs {
	const text = args.trim();
	if (text === "") return { kind: "split" };
	if (text === "--help" || text === "-h") return { kind: "help" };
	return { kind: "unknown", text };
}
