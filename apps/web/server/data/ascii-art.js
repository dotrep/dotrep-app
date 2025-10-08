/**
 * ASCII Art for the FSN text adventure quest system
 * These are displayed during different quest stages and interactions
 */

module.exports = {
  corridor: `
╔═══════════════════╗
║   You are here →  ║
║                   ║
║    DARK CORRIDOR  ║
║    ┌─────┐        ║
║    │     │        ║
║    │     │← Terminal Room
║    └─────┘        ║
║                   ║
║    ← Locked Door  ║
╚═══════════════════╝
`,

  terminal: `
╔══════════════════════╗
║  FLICKERING TERMINAL ║
║                      ║
║   [ ACCESS GRANTED ] ║
║     ||||||||||||||   ║
║    {HUMMING KEY}     ║
╚══════════════════════╝
`,

  secret_room: `
╔═══════════════════════════╗
║     🔒 SECRET VAULT ROOM   ║
║                           ║
║     You found:            ║
║     - Vault Patch         ║
║     - 20 XP               ║
╚═══════════════════════════╝
`,

  welcome: `
╔════════════════════════════════════╗
║        WELCOME TO FSN VAULT        ║
║                                    ║
║      ┌─────────────────────┐      ║
║      │                     │      ║
║      │     core.fsn        │      ║
║      │     TEXT QUEST      │      ║
║      │                     │      ║
║      └─────────────────────┘      ║
║                                    ║
║      Type 'start quest' to begin   ║
╚════════════════════════════════════╝
`,

  complete: `
╔════════════════════════════════════╗
║            QUEST COMPLETE          ║
║                                    ║
║             +55 XP                 ║
║                                    ║
║      [HUMMING KEY ACQUIRED]        ║
║      [VAULT PATCH ACQUIRED]        ║
║                                    ║
║      Type 'start quest' to play    ║
║      again or explore other        ║
║      commands!                     ║
╚════════════════════════════════════╝
`,

  inventory: `
╔════════════════════════════════════╗
║            INVENTORY               ║
║                                    ║
║      ┌─────────────────────┐      ║
║      │                     │      ║
║      │     ITEMS LIST      │      ║
║      │                     │      ║
║      └─────────────────────┘      ║
║                                    ║
╚════════════════════════════════════╝
`
};