require('dotenv').config();
const express = require("express");
const cors = require('cors');
const { Pool } = require('pg');


const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            text TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE
        );
    `);
}
initDB();



const fs = require("fs");
const FILE_PATH = "todos.json";

function loadTodos() {
    if (!fs.existsSync(FILE_PATH)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}
function saveTodos(todos) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(todos, null, 2), "utf-8");
}
let todos = loadTodos();


app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");


    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});



app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        const result = await pool.query(
            'INSERT INTO todos (text) VALUES ($1) RETURNING *',
            [text]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




app.delete('/', async (req, res) => {
    try {
        const { id } = req.body;
        await pool.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.patch('/', async (req, res) => {
    try {
        const { id } = req.body;
        await pool.query(
            'UPDATE todos SET completed = NOT completed WHERE id = $1',
            [id]
        );
        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});