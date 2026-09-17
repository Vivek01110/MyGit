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
        "MyGit - A Git-like version control system"
      );

      console.log();

      console.log("Available commands:");

      console.log();
      console.log("Local commands:");
      console.log("  mygit init");
      console.log("  mygit status");
      console.log("  mygit add <file> | mygit add .");
      console.log('  mygit commit -m "message"');
      console.log("  mygit log");
      console.log("  mygit branch [branch-name]");
      console.log("  mygit checkout <branch-name> | mygit checkout -b <new-branch>");

      console.log();
      console.log("Configuration:");
      console.log("  mygit config remote <server-url>    (e.g., https://mygit-api.onrender.com)");
      console.log("  mygit config                        (view current configuration)");

      console.log();
      console.log("Authentication:");
      console.log("  mygit login");
      console.log("  mygit logout");
      console.log("  mygit whoami");

      console.log();
      console.log("Remote & Repositories:");
      console.log("  mygit create <repository-name>");
      console.log("  mygit repos");
      console.log("  mygit remote add origin <repository-id>");
      console.log("  mygit remote -v");
      console.log("  mygit push [branch]");
      console.log("  mygit pull [branch]");
      console.log("  mygit clone <repository-id> [directory]");
  }
};

main();