import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pkg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
const { Pool } = pkg;
const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();

// Postgres connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "floatchat",
  password: "Himanshu@1234",
  port: 5432,
});

// Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Ask endpoint
app.post("/ask", async (req, res) => {
  const { query } = req.body;

  // 1. Prompt Gemini to create SQL
  const prompt = `
  You are a data assistant. Convert the user question into a valid PostgreSQL query.
  Use table: argo_profiles(platform_number, time_utc, lat, lon, depth, temperature, salinity).
  Only output SQL, no explanation.

  User question: ${query}
  `;

  try {
    const geminiRes = await model.generateContent(prompt);
    let sqlQuery = geminiRes.response.text().trim();

    // Clean the SQL response - remove markdown formatting if present
    sqlQuery = sqlQuery.replace(/```sql\s*/g, "").replace(/\s*```/g, "");

    console.log("Generated SQL:", sqlQuery);

    // 2. Run SQL
    const result = await pool.query(sqlQuery);
    res.json({ answer: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
