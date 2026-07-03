import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const projectId = process.env.SUPABASE_PROJECT_ID;
if (!projectId) {
  console.error("Defina SUPABASE_PROJECT_ID antes de executar npm run db:types.");
  process.exit(1);
}
const result = spawnSync("npx", ["supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  console.error(result.stderr || "Falha ao gerar tipos do Supabase.");
  process.exit(result.status ?? 1);
}
writeFileSync("src/types/database.generated.ts", result.stdout);
console.log("Tipos gerados em src/types/database.generated.ts");
