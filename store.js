import fs from "fs";
import { Pool } from "pg";
import { addDays, parseISO, format } from "date-fns";

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-young-sunset-adkhpzwh-pooler.c-2.us-east-1.aws.neon.tech",
  database: "neondb",
  password: "npg_NBs2mYW7UFKo",
  port: 5432,
  ssl: true
});
async function insertPuzzles() {
  try {
    // 1. Load JSON file
    const raw = fs.readFileSync("chess_levels.json", "utf-8");
    const puzzles = JSON.parse(raw);

    // 2. Filter only width === 4
    const filtered = puzzles.filter((p) => p.width === 4);

    // 3. Start level_date from 1st Sept 2025
    let startDate = parseISO("2025-11-07");

    for (let i = 0; i < filtered.length; i++) {
      const puzzle = filtered[i];

      // assign new sequential date
      const newDate = addDays(startDate, i);
      const levelDate = format(newDate, "yyyy-MM-dd");

      await pool.query(
        `INSERT INTO echo_puzzles 
        (daily_level_type, title, optimal_num_moves, fen, width, compound_fen, level_date, solution_path, created_date, updated_date) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          puzzle.daily_level_type,
          puzzle.title || "",
          puzzle.optimal_num_moves,
          puzzle.fen,
          puzzle.width,
          puzzle.compound_fen,
          levelDate,
          JSON.stringify(puzzle.solution_path), // store as text
        ]
      );

      console.log(`Inserted puzzle id:${puzzle.id} with date ${levelDate}`);
    }

    console.log("✅ All puzzles inserted!");
  } catch (err) {
    console.error("❌ Error inserting puzzles:", err);
  } finally {
    await pool.end();
  }
}

insertPuzzles();
