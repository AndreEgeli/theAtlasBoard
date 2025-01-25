import { execSync } from "child_process";
import { platform } from "os";

const isWindows = platform() === "win32";

try {
  console.log("Setting up Supabase CLI...");

  // Check if Supabase CLI is already installed
  try {
    execSync("supabase --version", { stdio: "ignore" });
    console.log("Supabase CLI is already installed.");
    process.exit(0);
  } catch (e) {
    // CLI not found, proceed with installation
  }

  if (isWindows) {
    console.log(`
      Please install Supabase CLI manually on Windows:
      
      1. Install Scoop first (if not installed):
         Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
         irm get.scoop.sh | iex
      
      2. Install Supabase CLI:
         scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
         scoop install supabase
         
      After installation, run: pnpm dev
    `);
    process.exit(1);
  } else {
    // For macOS/Linux
    execSync("curl -fsSL https://get.supabase.io/install.sh | sh", {
      stdio: "inherit",
    });
  }

  console.log("Supabase CLI installed successfully!");
} catch (error) {
  console.error("Failed to install Supabase CLI:", error);
  process.exit(1);
}
