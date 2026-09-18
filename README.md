# @vivek_011/vgit

A lightweight, Git-like distributed version control system CLI built from scratch with Node.js. Seamlessly connects to the **VGIT** cloud platform.

---

## Installation

Install globally via npm:

```bash
npm install -g @vivek_011/vgit
```

Or run directly without installing via `npx`:

```bash
npx @vivek_011/vgit
```

---

## Commands Reference

Once installed, use the **`vgit`** command in any terminal or project directory:

### Authentication
```bash
vgit login              # Interactive login to your VGIT account
vgit whoami             # Display currently authenticated user
vgit logout             # Log out and clear saved credentials
```

### Local Repository & Tracking
```bash
vgit init               # Initialize a new local repository
vgit status             # View working directory status & staged files
vgit add <file>         # Stage a specific file
vgit add .              # Stage all modified and untracked files
vgit commit -m "<msg>"  # Record staged snapshot into commit history
vgit log                # View commit history log
```

### Branches & Checkout
```bash
vgit branch             # List local branches
vgit branch <name>      # Create a new branch
vgit checkout <branch>  # Switch to a branch
vgit checkout -b <name> # Create and immediately switch to a new branch
vgit restore <file>     # Discard uncommitted changes in working file
```

### Remote & Cloud Sync
```bash
vgit create <repo-name> # Create a new remote repository on VGIT
vgit repos              # List all your remote repositories
vgit remote add origin <repo-id> # Set origin remote ID
vgit remote -v          # View configured remotes
vgit clone <repo-id>    # Clone a repository from VGIT
vgit push [origin] [branch]      # Push local commits to remote repository
vgit pull [origin] [branch]      # Pull and integrate remote commits
```

### Configuration
```bash
vgit config                      # View current configuration
vgit config remote <server-url>  # Set custom backend API URL
```

---

## Tech Stack
- **Runtime**: Node.js (>= 18.0.0)
- **Module System**: ES Modules (`type: "module"`)
- **API Communication**: Native Fetch API
- **Object Storage**: SHA-1 Content-Addressable Object Model

---

## License

MIT © [Vivek Kumar]
