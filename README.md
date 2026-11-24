# pi-split

`/split` for [Pi](https://pi.dev): branch the conversation at a message you pick, and continue it in a new
[Herdr](https://herdr.dev) pane. The original conversation keeps running, unchanged.

Use it to ask a side question, try another approach, or start a second task with the same background.

## Requirements

- Pi running in a pane of the **Herdr TUI** (the `herdr` command). The Herdr desktop app is not supported.
- `pi` on the `PATH` of new panes.
- A saved session (not `--no-session`) with at least one message.

Checked on Pi 1.6.0 and Herdr 0.9.5 on macOS. Other systems are untested.

## Install

```sh
pi install git:github.com/OldrichKruchna/pi-split
```

If Pi is already running, run `/reload` in it. Pi extensions run with your full user permissions, so read the
code first.

| To | Run |
|---|---|
| Update | `pi update --extensions` |
| Remove | `pi remove git:github.com/OldrichKruchna/pi-split` |
| Try it once | `pi -e git:github.com/OldrichKruchna/pi-split` |

## Use

| Type | What happens |
|---|---|
| `/split` | Opens the message picker |
| `/split --help` (or `-h`) | Shows help; nothing is created |

1. Run `/split`. It also works while the agent is busy.
2. Pick a message: type to search, `↑`/`↓` to move, `Enter` to split, `Esc` to cancel. The newest is selected.
   Messages from other branches of the session are listed too.
3. A pane opens on the right with Pi on a copy of the conversation, up to **and including** that message.
4. Type your next message there. The split does nothing until you do.

### The notice

Every split ends with a message the agent reads before yours:

> This conversation was split off from another conversation that is still running. [...] Do not act on, continue,
> or finish any request above [...] The other conversation is probably making changes right now [...]

The full text is in [`notice.ts`](notice.ts). Edit it there.

## Good to know

- **Nothing is locked.** Both conversations share one folder. The notice asks the agent to be careful, no more.
- **Running tools stay with the original.** In the split, an unfinished tool call shows as having no result.
- **Compaction:** whether the notice survives compaction of a long split is untested.
- **Labels** set with `shift+l` in the picker are not saved.

## Troubleshooting

| Message | What to do |
|---|---|
| `needs interactive Pi` | Run it in the Pi terminal UI, not print, JSON, or RPC mode |
| `Pi is not running in a Herdr pane` | Start Pi in a pane of the Herdr TUI |
| `this session is not saved (--no-session)` | Start Pi without `--no-session` |
| `nothing to split yet, send a message first` | Send a message, then split |
| `there is no message at or before that point` | Pick a later row |
| `unknown argument` | `/split` takes only `--help` |
| `Split opened in pane ..., check it` | Pi did not report ready; look at that pane |
| `The split is saved, open it with: ...` | Herdr could not open it; run the command shown |
| The new pane asks whether to trust the folder | Answer once; choose Trust to not be asked again |

## How it works

| File | Job |
|---|---|
| `index.ts` | The command: checks, then pick, branch, open |
| `help.ts` | Help text and arguments |
| `picker.ts` | Message picker, built on Pi's session tree |
| `branch.ts` | Writes the new session file with a separate `SessionManager`, so the live one is not touched |
| `notice.ts` | The notice text |
| `herdr.ts` | Opens the pane and starts Pi in it |

## Develop

```sh
git clone https://github.com/OldrichKruchna/pi-split && cd pi-split
npm install --ignore-scripts
npm test
pi -e ./index.ts
```

## License and credits

[MIT](LICENSE). Modelled on John Lindquist's [herdr-pi-split](https://github.com/johnlindquist/herdr-pi-split) from
MEGA.dev, which does more (naming, handoff summaries, the desktop app). The picker is adapted from it; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

[techybolek/pi-split](https://github.com/techybolek/pi-split) and
[herdr-aside](https://github.com/alexanderbianchi/herdr-aside) also gave ideas, such as retrying while a new shell starts.
