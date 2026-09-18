#!/usr/bin/env node

import { init } from "./commands/init.js";
import { status } from "./commands/status.js";
import { add } from "./commands/add.js";
import { commit } from "./commands/commit.js";
import { log } from "./commands/log.js";

import { login } from "./commands/login.js";
import { logout } from "./commands/logout.js";
import { whoami } from "./commands/whoami.js";

import { create } from "./commands/create.js";
import { push } from "./commands/push.js";
import { clone } from "./commands/clone.js";
import { pull } from "./commands/pull.js";
import { repos } from "./commands/repos.js";

import { branch } from "./commands/branch.js";
import { checkout } from "./commands/checkout.js";
import { config } from "./commands/config.js";
import { remote } from "./commands/remote.js";

const args = process.argv.slice(2);

const command = args[0];

const main = async () => {
  switch (command) {


    // LOCAL GIT COMMANDS


    case "init":
      init();
      break;

    case "status":
      status();
      break;

    case "add":
      add(args[1]);
      break;

    case "commit":
      commit(args.slice(1));
      break;

    case "log":
      log();
      break;



    // AUTH COMMANDS


    case "login":
      await login();
      break;

    case "logout":
      logout();
      break;

    case "whoami":
      await whoami();
      break;

    // REPO & REMOTE COMMANDS

    case "create":
      await create(args[1]);
      break;

    case "repos":
      await repos();
      break;

    case "branch":
      await branch(args[1]);
      break;

    case "checkout":
      await checkout(args[1], args[2]);
      break;

    case "restore":
      await checkout(args[1] || ".");
      break;

    case "config":
      await config(args[1], args[2]);
      break;

    case "push":
      await push(args[1], args[2]);
      break;

    case "clone":
      await clone(args[1], args[2]);
      break;

    case "pull":
      await pull(args[1], args[2]);
      break;

    case "remote":
      await remote(args[1], args[2], args[3]);
      break;


    // HELP


    default:
      console.log(
        "VGIT - A distributed version control system CLI"
      );

      console.log();

      console.log("Available commands:");

      console.log();
      console.log("Local commands:");
      console.log("  vgit init");
      console.log("  vgit status");
      console.log("  vgit add <file> | vgit add .");
      console.log('  vgit commit -m "message"');
      console.log("  vgit log");
      console.log("  vgit branch [branch-name]");
      console.log("  vgit checkout <branch-name> | vgit checkout -b <new-branch>");

      console.log();
      console.log("Configuration:");
      console.log("  vgit config remote <server-url>    (e.g., https://mygit-backend-04ux.onrender.com)");
      console.log("  vgit config                        (view current configuration)");

      console.log();
      console.log("Authentication:");
      console.log("  vgit login");
      console.log("  vgit logout");
      console.log("  vgit whoami");

      console.log();
      console.log("Remote & Repositories:");
      console.log("  vgit create <repository-name>");
      console.log("  vgit repos");
      console.log("  vgit remote add origin <repository-id>");
      console.log("  vgit remote -v");
      console.log("  vgit push [branch]");
      console.log("  vgit pull [branch]");
      console.log("  vgit clone <repository-id> [directory]");
  }
};

main();