import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function Header({ onOpenCreate, search, setSearch }) {
  return (
    <div className="header">
      <div>
        <h1 style={{margin:0,fontSize:20}}>NextIn</h1>
        <div style={{fontSize:12,opacity:0.9}}>Collaborative Project Manager</div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className="btn" onClick={onOpenCreate} style={{background:'white'}}>Create</button>
      </div>
    </div>
  );
}

function Sidebar({ stats }) {
  return (
    <aside className="sidebar">
      <h3>Project Overview</h3>
      <div>All: <strong>{stats.total}</strong></div>
      <div>Done: <strong>{stats.done}</strong></div>
      <hr />
      <h4>Assignees</h4>
      <ul>
        {Object.entries(stats.byAssignee).map(([a,c])=> <li key={a}>{a} ({c})</li>)}
      </ul>
    </aside>
  );
}

function Column({ column, issues, search, onOpen }) {
  const filtered = issues.filter(i=>{
    if(!search) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || (i.assignee||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q);
  });
  return (
    <div className="column">
      <h4>{column.title} ({issues.length})</h4>
      <Droppable droppableId={column.id} type="ISSUE">
        {(provided,snap)=>(
          <div ref={provided.innerRef} {...provided.droppableProps} style={{minHeight:60}}>
            {filtered.map((issue, idx)=>(
              <Draggable draggableId={issue.id} index={idx} key={issue.id}>
                {(prov, snap2)=>(
                  <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="card" onClick={()=>onOpen(issue.id)}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <strong style={{fontSize:13}}>{issue.title}</strong>
                      <small style={{fontSize:11}}>{issue.priority}</small>
                    </div>
                    <div style={{fontSize:12,opacity:0.7}}>{issue.type} • {issue.assignee}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function IssueModal({ issue, onClose, onSave, onDelete }) {
  const [form,setForm] = useState(issue||{});
  useEffect(()=>setForm(issue||{}),[issue]);
  if(!issue) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:40}}>
      <div style={{background:'white',width:'90%',maxWidth:640,padding:16,borderRadius:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>{issue.title}</h3>
          <div>
            <button className="btn" onClick={()=>onDelete(issue.id)} style={{color:'red',marginRight:8}}>Delete</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{marginTop:8}}>
          <label>Title</label>
          <input className="input" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} />
          <label>Assignee</label>
          <input className="input" value={form.assignee||''} onChange={e=>setForm({...form,assignee:e.target.value})} />
          <label>Type</label>
          <select className="input" value={form.type||'task'} onChange={e=>setForm({...form,type:e.target.value})}>
            <option value="task">Task</option>
            <option value="story">Story</option>
            <option value="bug">Bug</option>
          </select>
          <label>Priority</label>
          <select className="input" value={form.priority||'medium'} onChange={e=>setForm({...form,priority:e.target.value})}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label>Description</label>
          <textarea className="input" rows={4} value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}></textarea>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={()=>onSave(form)} style={{background:'#4f46e5',color:'white'}}>Save</button>
        </div>
      </div>
    </div>
  );
}

function CreateIssue({ onCreate, onClose }) {
  const [form,setForm] = useState({title:'',assignee:'',type:'task',priority:'medium',description:''});
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:40}}>
      <div style={{background:'white',padding:16,width:'90%',maxWidth:480,borderRadius:8}}>
        <h3>Create issue</h3>
        <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
        <input className="input" placeholder="Assignee" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} />
        <div style={{display:'flex',gap:8}}>
          <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option value="task">Task</option><option value="story">Story</option><option value="bug">Bug</option>
          </select>
          <select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <textarea className="input" rows={4} placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}></textarea>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={()=>{ if(!form.title) return alert('Add title'); onCreate(form); }} style={{background:'#4f46e5',color:'white'}}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [data, setData] = useState(null);
  const [modalId, setModalId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(()=>{ fetchBoard(); },[]);

  async function fetchBoard(){
    try{
      const res = await axios.get(API + '/api/board');
      setData(res.data);
    }catch(e){
      console.error(e);
      alert('Failed to fetch board from server. Make sure server is running on http://localhost:4000');
    }
  }

  function getStats(state){
    if(!state) return {total:0,done:0,byAssignee:{}};
    const total = Object.keys(state.issues).length;
    const done = state.columns.done.issueIds.length;
    const byAssignee = {};
    Object.values(state.issues).forEach(i=>{ const a = i.assignee||'Unassigned'; byAssignee[a] = (byAssignee[a]||0)+1; });
    return { total, done, byAssignee };
  }

  async function onDragEnd(result){
    const { destination, source, draggableId } = result;
    if(!destination) return;
    if(destination.droppableId === source.droppableId && destination.index === source.index) return;

    // optimistic UI
    const newData = JSON.parse(JSON.stringify(data));
    const start = newData.columns[source.droppableId];
    const finish = newData.columns[destination.droppableId];
    start.issueIds.splice(source.index,1);
    finish.issueIds.splice(destination.index,0,draggableId);
    setData(newData);

    try{
      await axios.post(API + '/api/move', { sourceCol: source.droppableId, destCol: destination.droppableId, sourceIndex: source.index, destIndex: destination.index, issueId: draggableId });
    }catch(e){
      console.error(e);
      fetchBoard();
    }
  }

  function openIssue(id){ setModalId(id); }
  function closeModal(){ setModalId(null); }

  async function saveIssue(updated){
    try{
      await axios.put(API + '/api/issues/' + updated.id, updated);
      fetchBoard();
      closeModal();
    }catch(e){ console.error(e); alert('Failed to save'); }
  }

  async function deleteIssue(id){
    if(!confirm('Delete?')) return;
    try{
      await axios.delete(API + '/api/issues/' + id);
      fetchBoard();
      closeModal();
    }catch(e){ console.error(e); alert('Failed to delete'); }
  }

  async function createIssue(form){
    try{
      await axios.post(API + '/api/issues', form);
      fetchBoard();
      setShowCreate(false);
    }catch(e){ console.error(e); alert('Failed to create'); }
  }

  if(!data) return <div style={{padding:20}}>Loading...</div>;
  const stats = getStats(data);

  return (
    <div>
      <Header onOpenCreate={()=>setShowCreate(true)} search={search} setSearch={setSearch} />
      <div className="container">
        <Sidebar stats={stats} />
        <main className="main">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="board">
              {data.columnOrder.map(colId=>{
                const column = data.columns[colId];
                const issues = column.issueIds.map(id=>data.issues[id]).filter(Boolean);
                return <Column key={colId} column={column} issues={issues} search={search} onOpen={openIssue} />;
              })}
            </div>
          </DragDropContext>
        </main>
      </div>

      {modalId && <IssueModal issue={data.issues[modalId]} onClose={closeModal} onSave={saveIssue} onDelete={deleteIssue} />}
      {showCreate && <CreateIssue onCreate={createIssue} onClose={()=>setShowCreate(false)} />}

      </div>
  );
}
