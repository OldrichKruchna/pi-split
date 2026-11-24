import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { createSplitSession } from "../branch.ts";
import { NOTICE, NOTICE_TYPE } from "../notice.ts";

const user = (text: string) => ({ role: "user" as const, content: text, timestamp: Date.now() });
const assistant = (content: any[]) =>
	({
		role: "assistant", content, api: "openai-completions", provider: "test", model: "test", timestamp: Date.now(),
		stopReason: content.some((c) => c.type === "toolCall") ? "toolUse" : "stop",
		usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
	}) as any;

function source() {
	const dir = mkdtempSync(join(tmpdir(), "pi-split-"));
	const sm = SessionManager.create(dir, dir);
	const settings = sm.appendThinkingLevelChange("off");
	const q1 = sm.appendMessage(user("first"));
	const a1 = sm.appendMessage(assistant([{ type: "text", text: "one" }]));
	const q2 = sm.appendMessage(user("second"));
	const call = sm.appendMessage(assistant([{ type: "toolCall", id: "c1", name: "bash", arguments: { command: "ls" } }]));
	return { dir, sm, file: sm.getSessionFile()!, ids: { settings, q1, a1, q2, call } };
}

const texts = (file: string) =>
	SessionManager.open(file).getBranch().flatMap((e: any) =>
		e.type === "message" ? [typeof e.message.content === "string" ? e.message.content : e.message.content.map((c: any) => c.text ?? c.name).join()] :
		e.type === "custom_message" ? [e.customType] : []);

test("keeps history through the picked message and ends with the notice", () => {
	const { file, ids } = source();
	const split = createSplitSession(file, ids.a1);
	assert.deepEqual(texts(split), ["first", "one", NOTICE_TYPE]);
	const last: any = SessionManager.open(split).getLeafEntry();
	assert.equal(last.content, NOTICE);
	assert.equal(last.display, true);
	assert.equal(SessionManager.open(split).getHeader()?.parentSession, file);
});

test("leaves the source file and the live manager unchanged", () => {
	const { sm, file, ids } = source();
	const before = readFileSync(file, "utf8");
	const leaf = sm.getLeafId();
	createSplitSession(file, ids.q1);
	assert.equal(readFileSync(file, "utf8"), before);
	assert.equal(sm.getSessionFile(), file);
	assert.equal(sm.getLeafId(), leaf);
});

test("can split at a user message and at a pending tool call", () => {
	const { file, ids } = source();
	assert.deepEqual(texts(createSplitSession(file, ids.q2)), ["first", "one", "second", NOTICE_TYPE]);
	assert.deepEqual(texts(createSplitSession(file, ids.call)), ["first", "one", "second", "bash", NOTICE_TYPE]);
});

test("can split on a branch that is not the active one", () => {
	const { sm, file, ids } = source();
	sm.branch(ids.q1);
	sm.appendMessage(assistant([{ type: "text", text: "other" }]));
	assert.deepEqual(texts(createSplitSession(file, ids.q2)), ["first", "one", "second", NOTICE_TYPE]);
});

test("refuses a point before the first message and writes nothing", () => {
	const { dir, file, ids } = source();
	assert.throws(() => createSplitSession(file, ids.settings), /no message/);
	assert.equal(readdirSync(dir).length, 1);
});
