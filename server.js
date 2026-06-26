const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const SECRET = "Krishna";
app.use(cookieParser());
let users = [];
app.use(express.json());
function authenticate(req,res,next){
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({error: "User is not logged in"});
    }
    try{
        const decoded = jwt.verify(token,SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch(e){
        return res.status(401).json({error: "Invalid token"});
    }
}
if(fs.existsSync("users.json")){
    try{
        const content = fs.readFileSync("users.json","utf-8");
        users = content?JSON.parse(content):[];
    }
    catch(e){
        users = [];
    }
}
function saveUsers(){
    fs.writeFileSync("users.json",JSON.stringify(users));
}
let nextUserId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
app.post("/register",async (req,res)=>{
    const {username,password} = req.body;
    const existing = users.find((obj)=>obj.username === username);
    if(existing){
        return res.status(409).json({error: "The User already exists"});
    }
    const hashedPassword = await bcrypt.hash(password,10);
    users.push({id: nextUserId,username,password: hashedPassword});
    nextUserId++;
    saveUsers();
    res.json({message: "User registered successfully"});
});
app.get("/login",(req,res)=>{
    res.sendFile(path.join(__dirname,"login.html"));
});
app.post("/login",async (req,res)=>{
    const {username,password} = req.body;
    const existing = users.find((obj)=>obj.username === username);
    if(!existing){
        return res.status(401).json({error: "Invalid Username or Password"});
    }
    const match = await bcrypt.compare(password,existing.password);
    if(!match){
        return res.status(401).json({error: "Invalid Password"});
    }  
    const token = jwt.sign({ userId: existing.id }, SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Logged in successfully" });
});
app.get("/logout",(req,res)=>{
    res.clearCookie("token");
    res.json({message: "Logged out successfully"});
});
let notes = [];
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
app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});
app.get("/login_style.css",(req,res)=>{
    res.sendFile(path.join(__dirname,"login_style.css"));
});
app.get("/notes", authenticate,(req, res) => {
    const userNotes = notes.filter((note)=>note.userId === req.userId);
    res.json(userNotes);
});

app.post("/notes", authenticate,(req, res) => {
    const newnote = req.body;
    const data = { id: nextId, ...newnote, userId: req.userId,createdAt: Date.now() };
    notes.push(data);
    nextId++; // was missing
    saveNotes();
    const userNotes = notes.filter((note)=>note.userId === req.userId);
    res.json(userNotes);
});

app.put("/notes/:id",authenticate, (req, res) => {
    const id = parseInt(req.params.id); 
    const { title, body } = req.body;
    const note = notes.find((obj) => obj.id === id && obj.userId === req.userId);
    if (!note) return res.status(404).json({ error: "Note not found" });
    note.title = title;
    note.body = body;
    saveNotes();
    const userNotes = notes.filter((note)=>note.userId === req.userId);
    res.json(userNotes);
});

app.delete("/notes/:id", authenticate,(req, res) => {
    const id = parseInt(req.params.id); // use params not body
    notes = notes.filter((obj) => !(obj.id === id && obj.userId === req.userId)); // was missing reassignment
    saveNotes();
    const userNotes = notes.filter((n)=>n.userId == req.userId);
    res.json(userNotes);
});

app.listen(4000, () => {
    console.log("Server running at http://localhost:4000");
});