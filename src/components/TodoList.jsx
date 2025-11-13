import React from 'react'
import TodoItem from './TodoItem.jsx'

export default function TodoList({ todos, onToggle, onDelete, onUpdate, stageLabels }) {
  if (!todos.length) {
    return (
      <div className="empty-state">
        <span className="emoji">✨</span>
        <p>まだタスクがありません。<br />VTuberテンプレートを追加するか、自分でタスクを追加してみましょう！</p>
      </div>
    )
  }
  return (
    <ul className="todo-list">
      {todos.map((t, index) => (
        <TodoItem 
          key={t.id} 
          todo={t} 
          index={index}
          onToggle={onToggle} 
          onDelete={onDelete}
          onUpdate={onUpdate}
          stageLabels={stageLabels} 
        />
      ))}
    </ul>
  )
}
