import { existsSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createSplitSession } from "./branch.ts";
import { HELP, parseArgs } from "./help.ts";
import { openInNewPane } from "./herdr.ts";
import { pickEntry } from "./picker.ts";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("split", {
		description: "Branch this conversation at a message you pick into a new Herdr pane (--help)",
		// No argument completions: with the menu open, Enter on "/split " would insert --help instead of splitting.
		handler: async (args, ctx) => {
			const fail = (message: string) => ctx.ui.notify(`/split: ${message}`, "error");

			const parsed = parseArgs(args);
			if (parsed.kind === "help") return ctx.ui.notify(HELP, "info");
			if (parsed.kind === "unknown") return fail(`unknown argument "${parsed.text}", try /split --help`);

			if (ctx.mode !== "tui") return fail("needs interactive Pi");
			if (process.env.HERDR_ENV !== "1" || !process.env.HERDR_PANE_ID) return fail("Pi is not running in a Herdr pane");
			const sourceFile = ctx.sessionManager.getSessionFile();
			if (!sourceFile) return fail("this session is not saved (--no-session)");
			if (!existsSync(sourceFile)) return fail("nothing to split yet, send a message first");

			const entryId = await pickEntry(ctx);
			if (!entryId) return;

			let splitFile: string | undefined;
			try {
				splitFile = createSplitSession(sourceFile, entryId);
				const { paneId, warning } = await openInNewPane(pi.exec.bind(pi), splitFile, ctx.cwd);
				if (warning) ctx.ui.notify(`Split opened in pane ${paneId}, check it: ${warning}\nSession: ${splitFile}`, "warning");
				else ctx.ui.notify(`Split opened in pane ${paneId}`, "info");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				fail(splitFile ? `${message}\nThe split is saved, open it with: pi --session '${splitFile}'` : message);
			}
		},
	});
}
