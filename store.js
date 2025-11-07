import fs from "fs";
import { Pool } from "pg";
import { addDays, parseISO, format } from "date-fns";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Postgres connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function insertPuzzles() {
  try {
    // 1. Load JSON file
    const raw = fs.readFileSync("chess_levels.json", "utf-8");
    const puzzles = JSON.parse(raw);

    // 2. Filter only width === 4
    const filtered = puzzles.filter((p) => p.width === 4);

    // 3. Start level_date from 7th Nov 2025
    const startDate = parseISO("2025-11-07");

    for (let i = 0; i < filtered.length; i++) {
      const puzzle = filtered[i];
      const newDate = addDays(startDate, i);
      const levelDate = format(newDate, "yyyy-MM-dd");

      await pool.query(
        `INSERT INTO gobble_puzzles 
        ( title, optimal_num_moves, fen, width, compound_fen, level_date, solution_path, created_date, updated_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          puzzle.title || "",
          puzzle.optimal_num_moves,
          puzzle.fen,
          puzzle.width,
          puzzle.compound_fen,
          levelDate,
          JSON.stringify(puzzle.solution_path),
        ]
      );

      console.log(`✅ Inserted puzzle with date ${levelDate}`);
    }

    console.log("🎉 All puzzles inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting puzzles:", err);
  } finally {
    await pool.end();
  }
}

insertPuzzles();
