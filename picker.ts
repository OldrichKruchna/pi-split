import { type ExtensionContext, TreeSelectorComponent } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

/** Show Pi's searchable session tree. Resolves with the chosen entry id, or undefined on Esc. */
export function pickEntry(ctx: ExtensionContext): Promise<string | undefined> {
	const tree = ctx.sessionManager.getTree();
	const leafId = ctx.sessionManager.getLeafId();
	return ctx.ui.custom<string | undefined>((tui, theme, _keybindings, done) => {
		const selector = new TreeSelectorComponent(
			tree,
			leafId,
			tui.terminal.rows,
			(entryId) => done(entryId),
			() => done(undefined),
			undefined,
			undefined,
			"no-tools",
		);
		const title = theme.fg("accent", "Split after which message?") + theme.fg("dim", "  Enter: split · Esc: cancel");
		return {
			render: (width: number) => [title, ...selector.render(width)].map((line) => truncateToWidth(line, width)),
			invalidate: () => selector.invalidate(),
			handleInput: (data: string) => {
				selector.handleInput(data);
				tui.requestRender();
			},
			get focused() {
				return selector.focused;
			},
			set focused(value: boolean) {
				selector.focused = value;
			},
		};
	});
}
