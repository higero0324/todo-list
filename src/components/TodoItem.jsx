import React, { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'

export default function TodoItem({ todo, index, onToggle, onDelete, onUpdate, stageLabels }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState(todo.data?.notes || '')
  const [links, setLinks] = useState(todo.data?.links || '')
  const [mainColor, setMainColor] = useState(todo.data?.mainColor || '#ff9ec7')
  const [subColor, setSubColor] = useState(todo.data?.subColor || '#9ed4ff')
  const [items, setItems] = useState(todo.data?.items || [])
  const [params, setParams] = useState(todo.data?.params || [])

  const handleSave = () => {
    const title = editValue.trim()
    if (title && title !== todo.title) {
      onUpdate(todo.id, { title })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(todo.title)
    setIsEditing(false)
  }

  const handleSaveDetails = () => {
    // 型に応じて data を更新
    if (todo.type === 'references') {
      onUpdate(todo.id, { data: { ...todo.data, links } })
    } else if (todo.type === 'palette') {
      onUpdate(todo.id, { data: { ...todo.data, mainColor, subColor, notes } })
    } else if (todo.type === 'physics') {
      onUpdate(todo.id, { data: { ...todo.data, params } })
    } else if (['expressions', 'outfit', 'checklist', 'rough', 'lineart', 'coloring', 'parts', 'cubism', 'face', 'motion', 'export'].includes(todo.type)) {
      onUpdate(todo.id, { data: { ...todo.data, items, notes } })
    } else {
      onUpdate(todo.id, { data: { ...todo.data, notes } })
    }
  }

  const handleCheckItem = (idx) => {
    const updated = items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item)
    setItems(updated)
    const data = todo.type === 'physics' ? { params } : { items: updated, notes }
    onUpdate(todo.id, { data: { ...todo.data, ...data } })
  }

  const handleAddItem = (defaultName = '新しい項目') => {
    const updated = [...items, { name: defaultName, checked: false }]
    setItems(updated)
  }

  const handleEditItemName = (idx, newName) => {
    const updated = items.map((item, i) => i === idx ? { ...item, name: newName } : item)
    setItems(updated)
  }

  const handleRemoveItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx)
    setItems(updated)
    const data = { items: updated, notes }
    onUpdate(todo.id, { data: { ...todo.data, ...data } })
  }

  const handleParamChange = (idx, value) => {
    const updated = params.map((p, i) => i === idx ? { ...p, value: parseInt(value, 10) } : p)
    setParams(updated)
  }

  const hasContent = (todo.data?.notes || todo.data?.links || todo.data?.mainColor || todo.data?.subColor || (todo.data?.items && todo.data.items.length > 0) || (todo.data?.params && todo.data.params.length > 0))

  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <li 
          className={`todo-item ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="todo-main" {...provided.dragHandleProps}>
            <span className="drag-handle" title="ドラッグして並べ替え">⋮⋮</span>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
              aria-label={`${todo.title} を${todo.completed ? '未完了に' : '完了に'}する`}
            />
            <span className={`stage-badge ${todo.stage}`}>
              {stageLabels[todo.stage] || '🎨 キャラデザ'}
            </span>
            {isEditing ? (
              <div className="edit-inline">
                <input
                  type="text"
                  className="edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  autoFocus
                />
                <button className="save-btn" onClick={handleSave}>保存</button>
                <button className="cancel-btn" onClick={handleCancel}>✕</button>
              </div>
            ) : (
              <>
                <span 
                  className={"title" + (todo.completed ? ' done' : '')}
                  onDoubleClick={() => setIsEditing(true)}
                  title="ダブルクリックで編集"
                >
                  {todo.title}
                  {hasContent && <span className="has-content-indicator">📝</span>}
                </span>
                <button 
                  className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title="詳細を表示/非表示"
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
                <button className="edit-btn" onClick={() => setIsEditing(true)} aria-label="編集">
                  ✏️
                </button>
              </>
            )}
            <button className="danger" onClick={() => onDelete(todo.id)} aria-label={`${todo.title} を削除`}>
              削除
            </button>
          </div>
          
          {isExpanded && (
            <div className="todo-details">
              {/* チェックリスト型 (expressions, outfit, checklist, rough, lineart, coloring, parts, cubism, face, motion, export) */}
              {['expressions', 'outfit', 'checklist', 'rough', 'lineart', 'coloring', 'parts', 'cubism', 'face', 'motion', 'export'].includes(todo.type) && (
                <div className="detail-section">
                  <label className="detail-label">✅ チェックリスト</label>
                  {items.map((item, idx) => (
                    <div key={idx} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleCheckItem(idx)}
                      />
                      <input
                        type="text"
                        className="checklist-name"
                        value={item.name}
                        onChange={(e) => handleEditItemName(idx, e.target.value)}
                        onBlur={handleSaveDetails}
                        placeholder="項目名..."
                      />
                      <button className="remove-item-btn" onClick={() => handleRemoveItem(idx)}>✕</button>
                    </div>
                  ))}
                  <button className="add-item-btn" onClick={() => handleAddItem()}>+ 項目を追加</button>
                  {['rough', 'lineart', 'coloring'].includes(todo.type) && (
                    <div className="detail-section" style={{ marginTop: '10px' }}>
                      <label className="detail-label">📝 メモ</label>
                      <textarea
                        className="detail-textarea"
                        placeholder="ラフのポイント、線画の仕上がり、着色の注意点など..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={handleSaveDetails}
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 物理演算スライダー */}
              {todo.type === 'physics' && (
                <div className="detail-section">
                  <label className="detail-label">⚙️ 物理演算パラメータ</label>
                  {params.map((param, idx) => (
                    <div key={idx} className="physics-param">
                      <span className="param-label">{param.name}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={param.value}
                        onChange={(e) => handleParamChange(idx, e.target.value)}
                        onMouseUp={handleSaveDetails}
                        onTouchEnd={handleSaveDetails}
                        className="param-slider"
                      />
                      <span className="param-value">{param.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 汎用メモ型 */}
              {(!todo.type || todo.type === 'generic' || todo.type === 'concept') && (
                <div className="detail-section">
                  <label className="detail-label">📝 メモ・コンセプト・詳細</label>
                  <textarea
                    className="detail-textarea"
                    placeholder="世界観、コンセプト、色の方向性、参考になった作品など、自由にメモできます..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveDetails}
                    rows={4}
                  />
                </div>
              )}

              {/* 参考リンク型 */}
              {todo.type === 'references' && (
                <div className="detail-section">
                  <label className="detail-label">🔗 参考リンク・URL</label>
                  <textarea
                    className="detail-textarea links-input"
                    placeholder="参考画像URL、Pinterest、Pixivリンクなど（1行に1つずつ）"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    onBlur={handleSaveDetails}
                    rows={3}
                  />
                  {links && (
                    <div className="links-preview">
                      {links.split('\n').filter(l => l.trim()).map((link, i) => (
                        <a 
                          key={i} 
                          href={link.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link-chip"
                        >
                          🔗 リンク {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* カラーパレット型 */}
              {todo.type === 'palette' && (
                <div className="detail-section">
                  <label className="detail-label">🎨 カラーパレット</label>
                  <div className="color-row">
                    <div className="color-field">
                      <span className="color-label">メインカラー</span>
                      <div className="color-inputs">
                        <input type="color" value={mainColor} onChange={(e) => { setMainColor(e.target.value); }} onBlur={handleSaveDetails} />
                        <input type="text" value={mainColor} onChange={(e) => setMainColor(e.target.value)} onBlur={handleSaveDetails} />
                      </div>
                      <span className="color-chip" style={{ background: mainColor }} />
                    </div>
                    <div className="color-field">
                      <span className="color-label">サブカラー</span>
                      <div className="color-inputs">
                        <input type="color" value={subColor} onChange={(e) => { setSubColor(e.target.value); }} onBlur={handleSaveDetails} />
                        <input type="text" value={subColor} onChange={(e) => setSubColor(e.target.value)} onBlur={handleSaveDetails} />
                      </div>
                      <span className="color-chip" style={{ background: subColor }} />
                    </div>
                  </div>
                  <div className="detail-section">
                    <label className="detail-label">メモ</label>
                    <textarea
                      className="detail-textarea"
                      placeholder="この配色の意図や使用箇所など..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={handleSaveDetails}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </li>
      )}
    </Draggable>
  )
}
