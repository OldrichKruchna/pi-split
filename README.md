# pi-split

`/split` in Pi: pick a message, and a new Herdr pane opens beside you running Pi on a copy of the
conversation up to and including that message. The copy ends with a notice telling its agent that the
earlier work belongs to another, still running conversation. The original session is not changed.

Needs Pi in a pane of the Herdr TUI (`herdr`), with `pi` on the PATH. Checked on Pi 1.6.0, Herdr 0.9.5, macOS.

    pi install ~/Development/pi-split     # then /reload
    npm install --ignore-scripts && npm test

| File | Job |
|---|---|
| `index.ts` | the command: checks, then pick, branch, open |
| `picker.ts` | message picker (Pi's session tree) |
| `branch.ts` | writes the new session file |
| `notice.ts` | the notice text, edit it here |
| `herdr.ts` | opens the pane and starts Pi |

Both conversations share one working directory. The notice asks the agent to be careful; it does not lock files.

Inspired by [johnlindquist/herdr-pi-split](https://github.com/johnlindquist/herdr-pi-split) (MIT).
