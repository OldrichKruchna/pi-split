import { rmSync } from "node:fs";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { NOTICE, NOTICE_TYPE } from "./notice.ts";

/**
 * Copy the path from the root through `entryId` into a new session file that ends with the notice.
 *
 * This opens its own SessionManager on the file. createBranchedSession() moves the manager it is
 * called on to the new file, so calling it on Pi's live manager would move Main into the split.
 */
export function createSplitSession(sourceFile: string, entryId: string): string {
	const manager = SessionManager.open(sourceFile);
	const hasConversation = manager
		.getBranch(entryId)
		.some((e) => e.type === "message" && (e.message.role === "user" || e.message.role === "assistant"));
	// Pi does not write a session file before the first message, so there would be nothing to open.
	if (!hasConversation) throw new Error("there is no message at or before that point");

	const splitFile = manager.createBranchedSession(entryId);
	if (!splitFile || splitFile === sourceFile) throw new Error("Pi did not create a separate session file");
	try {
		manager.appendCustomMessageEntry(NOTICE_TYPE, NOTICE, true);
	} catch (error) {
		// Never leave a split without its notice: it would look like the original conversation.
		rmSync(splitFile, { force: true });
		throw error;
	}
	return splitFile;
}
