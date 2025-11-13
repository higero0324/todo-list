import React, { useState } from 'react'

export default function TodoInput({ onAdd, stages, stageLabels }) {
  const [value, setValue] = useState('')
  const [selectedStage, setSelectedStage] = useState(stages.CHARA_DESIGN)

  const submit = (e) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    onAdd(title, selectedStage)
    setValue('')
  }

  return (
    <form className="row" onSubmit={submit}>
      <select 
        className="stage-select"
        value={selectedStage}
        onChange={(e) => setSelectedStage(e.target.value)}
        aria-label="フェーズ選択"
      >
        {Object.entries(stageLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="タスクを追加..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="新しいタスク名"
      />
      <button className="primary" type="submit">追加</button>
    </form>
  )
}
