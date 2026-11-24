import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs } from "../help.ts";

test("only an empty argument starts a split", () => {
	assert.deepEqual(parseArgs(""), { kind: "split" });
	assert.deepEqual(parseArgs("  "), { kind: "split" });
});

test("--help and -h show help", () => {
	assert.deepEqual(parseArgs(" --help "), { kind: "help" });
	assert.deepEqual(parseArgs("-h"), { kind: "help" });
});

test("anything else is reported, not ignored", () => {
	assert.deepEqual(parseArgs("fix the tests"), { kind: "unknown", text: "fix the tests" });
});
