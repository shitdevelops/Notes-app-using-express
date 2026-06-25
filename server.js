const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
let notes = [];
app.use(express.static(__dirname));
app.use(express.json());
if (fs.existsSync("data.json")) {
    try {
        const content = fs.readFileSync("data.json", "utf-8");
        notes = content ? JSON.parse(content) : [];
    } catch (e) {
        notes = [];
    }
}

// nextId must be after loading from file
let nextId = notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1;

function saveNotes() {
    fs.writeFileSync("data.json", JSON.stringify(notes));
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/notes", (req, res) => {
    res.json(notes);
});

app.post("/notes", (req, res) => {
    const newnote = req.body;
    const data = { id: nextId, ...newnote, createdAt: Date.now() };
    notes.push(data);
    nextId++; // was missing
    saveNotes();
    res.json(notes);
});

app.put("/notes/:id", (req, res) => {
    const id = parseInt(req.params.id); // was missing
    const { title, body } = req.body;
    const note = notes.find((obj) => obj.id === id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    note.title = title;
    note.body = body;
    saveNotes();
    res.json(notes);
});

app.delete("/notes/:id", (req, res) => {
    const id = parseInt(req.params.id); // use params not body
    notes = notes.filter((obj) => obj.id !== id); // was missing reassignment
    saveNotes();
    res.json(notes);
});

app.listen(4000, () => {
    console.log("Server running at http://localhost:4000");
});