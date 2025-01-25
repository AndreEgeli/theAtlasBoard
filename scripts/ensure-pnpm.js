// Ensure users are using pnpm instead of npm or yarn
if (process.env.npm_execpath && !process.env.npm_execpath.includes("pnpm")) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    `
    You are using ${
      /yarn/.test(process.env.npm_execpath) ? "Yarn" : "NPM"
    } to install dependencies.
    Please use pnpm for this project by following these steps:
    
    1. Install pnpm globally:
       curl -fsSL https://get.pnpm.io/install.sh | sh -
       
    2. Remove existing node_modules and lock files:
       pnpm clean
       
    3. Install dependencies using pnpm:
       pnpm install
    
    For more information, visit: https://pnpm.io/installation
  `
  );
  process.exit(1);
}
