const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

function readData(){
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch(e) {
    return { columns: {
      backlog: { id: 'backlog', title: 'Backlog', issueIds: [] },
      todo: { id: 'todo', title: 'To Do', issueIds: [] },
      inprogress: { id: 'inprogress', title: 'In Progress', issueIds: [] },
      review: { id: 'review', title: 'In Review', issueIds: [] },
      done: { id: 'done', title: 'Done', issueIds: [] }
    }, columnOrder: ['backlog','todo','inprogress','review','done'], issues: {} };
  }
}

function writeData(d){
  fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2));
}

// API endpoints

// Get whole board
app.get('/api/board', (req, res) => {
  const d = readData();
  res.json(d);
});

// Create issue
app.post('/api/issues', (req, res) => {
  const d = readData();
  const id = uuidv4();
  const issue = { id, title: req.body.title||'Untitled', assignee: req.body.assignee||'', type: req.body.type||'task', priority: req.body.priority||'medium', description: req.body.description||'' };
  d.issues[id] = issue;
  d.columns.backlog.issueIds.unshift(id);
  writeData(d);
  res.status(201).json(issue);
});

// Update issue
app.put('/api/issues/:id', (req, res) => {
  const d = readData();
  const id = req.params.id;
  if(!d.issues[id]) return res.status(404).json({error:'Not found'});
  d.issues[id] = {...d.issues[id], ...req.body};
  writeData(d);
  res.json(d.issues[id]);
});

// Delete issue
app.delete('/api/issues/:id', (req, res) => {
  const d = readData();
  const id = req.params.id;
  if(!d.issues[id]) return res.status(404).json({error:'Not found'});
  delete d.issues[id];
  Object.values(d.columns).forEach(c => { c.issueIds = c.issueIds.filter(x => x !== id); });
  writeData(d);
  res.json({ok:true});
});

// Move issue (reorder or change column)
app.post('/api/move', (req, res) => {
  // body: { sourceCol, destCol, sourceIndex, destIndex, issueId }
  const d = readData();
  const { sourceCol, destCol, sourceIndex, destIndex, issueId } = req.body;
  if(!d.issues[issueId]) return res.status(404).json({error:'Issue not found'});
  const start = d.columns[sourceCol];
  const finish = d.columns[destCol];
  if(!start || !finish) return res.status(400).json({error:'Invalid columns'});
  // remove from start
  start.issueIds.splice(sourceIndex, 1);
  // insert into finish
  finish.issueIds.splice(destIndex, 0, issueId);
  writeData(d);
  res.json({ok:true});
});

const PORT = process.env.PORT||4000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
