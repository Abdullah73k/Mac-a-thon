/**
 * Prints the warehouse schema SQL so you can run it in your warehouse UI.
 * Usage: bun run warehouse:schema
 */

import { readFileSync } from "fs";
import { join } from "path";

const schemaPath = join(import.meta.dir, "schema.sql");
const sql = readFileSync(schemaPath, "utf-8");
console.log(sql);
console.log("\n-- Copy the above into your warehouse UI and execute.");
