import React, { useState } from 'react'

const PRESET_COLORS = [
  '#ff9ec7', '#ffb3d9', '#ffc8e3', '#d4b3ff', '#b3d4ff', 
  '#a8e6cf', '#ffd4a3', '#ffb3ba', '#c7b3ff', '#b3f5ff'
]

export default function CharacterSelector({ 
  characters, 
  currentCharacter, 
  onSelectCharacter, 
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter 
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    onAddCharacter(name, color)
    setNewName('')
    setIsAdding(false)
  }

  const handleEdit = (char) => {
    setEditingId(char.id)
    setEditName(char.name)
  }

  const handleSaveEdit = (id) => {
    const name = editName.trim()
    if (name) {
      onUpdateCharacter(id, { name })
    }
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="character-selector">
      <div className="character-tabs">
        {characters.map(char => (
          <div key={char.id} className="character-tab-wrapper">
            {editingId === char.id ? (
              <div className="character-edit-inline">
                <input
                  type="text"
                  className="character-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(char.id)
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                />
                <button className="save-btn" onClick={() => handleSaveEdit(char.id)}>✓</button>
                <button className="cancel-btn" onClick={handleCancelEdit}>✕</button>
              </div>
            ) : (
              <>
                <button
                  className={`character-tab ${currentCharacter.id === char.id ? 'active' : ''}`}
                  style={{ '--char-color': char.color }}
                  onClick={() => onSelectCharacter(char.id)}
                >
                  <span className="char-emoji">👤</span>
                  <span className="char-name">{char.name}</span>
                </button>
                <div className="character-actions">
                  <button 
                    className="edit-char-btn" 
                    onClick={() => handleEdit(char)}
                    title="名前を編集"
                  >
                    ✏️
                  </button>
                  {characters.length > 1 && (
                    <button 
                      className="delete-char-btn" 
                      onClick={() => {
                        if (confirm(`${char.name} を削除しますか？このキャラのタスクもすべて削除されます。`)) {
                          onDeleteCharacter(char.id)
                        }
                      }}
                      title="キャラを削除"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {isAdding ? (
          <form className="character-add-form" onSubmit={handleAdd}>
            <input
              type="text"
              className="character-name-input"
              placeholder="キャラクター名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="save-btn">追加</button>
            <button type="button" className="cancel-btn" onClick={() => { setIsAdding(false); setNewName('') }}>
              キャンセル
            </button>
          </form>
        ) : (
          <button className="add-character-btn" onClick={() => setIsAdding(true)}>
            ＋ 新規キャラ
          </button>
        )}
      </div>
    </div>
  )
}
