import assert from "node:assert/strict";
import { test } from "node:test";
import { openInNewPane } from "../herdr.ts";

/** A fake herdr whose `agent start` fails with `errorCode` the first `failures` times. */
function fakeHerdr(errorCode: string, failures: number) {
	const calls: string[] = [];
	const ok = (result: unknown) => ({ code: 0, stdout: JSON.stringify({ result }), stderr: "" });
	const exec = async (_command: string, args: string[]) => {
		const name = args.slice(0, 2).join(" ");
		calls.push(name);
		if (name === "pane split") return ok({ pane: { pane_id: "w1:p9" } });
		if (name === "agent start" && failures-- > 0) {
			return { code: 1, stdout: "", stderr: JSON.stringify({ error: { code: errorCode, message: "no" } }) };
		}
		return ok({});
	};
	return { exec, calls };
}

test("retries while the new shell is not ready", async () => {
	const { exec, calls } = fakeHerdr("agent_pane_busy", 2);
	assert.deepEqual(await openInNewPane(exec, "/s.jsonl", "/c"), { paneId: "w1:p9" });
	assert.equal(calls.filter((c) => c === "agent start").length, 3);
});

test("closes the pane when the shell never gets ready", async () => {
	const { exec, calls } = fakeHerdr("agent_pane_busy", Infinity);
	await assert.rejects(openInNewPane(exec, "/s.jsonl", "/c"), /agent start: no/);
	assert.equal(calls.at(-1), "pane close");
});

test("keeps the pane and warns when Pi did start but is not ready", async () => {
	const { exec, calls } = fakeHerdr("agent_not_ready", 1);
	assert.deepEqual(await openInNewPane(exec, "/s.jsonl", "/c"), { paneId: "w1:p9", warning: "herdr agent start: no" });
	assert.ok(!calls.includes("pane close"));
});
