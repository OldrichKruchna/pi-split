import { randomUUID } from "node:crypto";

type Exec = (
	command: string,
	args: string[],
	options?: { timeout?: number },
) => Promise<{ code: number; stdout: string; stderr: string }>;

class HerdrError extends Error {
	readonly code: string | undefined;
	constructor(message: string, code?: string) {
		super(message);
		this.code = code;
	}
}

/** Run a herdr command and return its `result`. Herdr prints errors as JSON on stderr. */
async function herdr(exec: Exec, args: string[], timeout = 10_000): Promise<any> {
	const label = `herdr ${args.slice(0, 2).join(" ")}`;
	const { code, stdout, stderr } = await exec(process.env.HERDR_BIN_PATH || "herdr", args, { timeout });
	if (code === 0) return JSON.parse(stdout).result;
	let error: { code?: string; message?: string } | undefined;
	try {
		error = JSON.parse(stderr).error;
	} catch {
		// Not JSON: a usage error or a missing binary.
	}
	throw new HerdrError(`${label}: ${error?.message ?? (stderr.trim() || `exit code ${code}`)}`, error?.code);
}

export interface Launch {
	paneId: string;
	/** Set when the pane is open but Pi was not confirmed ready there, e.g. it shows the trust dialog. */
	warning?: string;
}

/** Open a pane beside the calling one and start Pi on `sessionFile` in it. */
export async function openInNewPane(exec: Exec, sessionFile: string, cwd: string): Promise<Launch> {
	const split = await herdr(exec, ["pane", "split", "--current", "--direction", "right", "--cwd", cwd, "--focus"]);
	const paneId: string = split.pane.pane_id;
	const name = `split-${randomUUID().slice(0, 8)}`;
	const start = ["agent", "start", name, "--kind", "pi", "--pane", paneId, "--", "--session", sessionFile];

	// A new pane's shell needs a moment to reach its prompt; until then Herdr answers agent_pane_busy.
	const deadline = Date.now() + 10_000;
	while (true) {
		try {
			await herdr(exec, start, 45_000);
			return { paneId };
		} catch (error) {
			const busy = error instanceof HerdrError && error.code === "agent_pane_busy";
			if (busy && Date.now() < deadline) {
				await new Promise((resolve) => setTimeout(resolve, 250));
				continue;
			}
			if (busy) {
				// Pi was never started, so the pane is only an empty shell.
				await herdr(exec, ["pane", "close", paneId]).catch(() => undefined);
				throw error;
			}
			// Pi may be running or have printed why it is not: keep the pane so that can be seen.
			return { paneId, warning: error instanceof Error ? error.message : String(error) };
		}
	}
}
