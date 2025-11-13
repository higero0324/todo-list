import React, { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import TodoInput from './components/TodoInput.jsx'
import TodoList from './components/TodoList.jsx'
import CharacterSelector from './components/CharacterSelector.jsx'

const STORAGE_KEY = 'vtuber-todo/data'
const DEFAULT_CHARACTER = { id: 'default', name: '新規VTuber', color: '#ff9ec7' }

const STAGES = {
  CHARA_DESIGN: 'chara-design',
  ILLUSTRATION: 'illustration',
  LIVE2D: 'live2d',
}

const STAGE_LABELS = {
  [STAGES.CHARA_DESIGN]: '🎨 キャラデザ',
  [STAGES.ILLUSTRATION]: '✏️ 立ち絵',
  [STAGES.LIVE2D]: '💫 Live2D',
}

// タスクのタイプ定義
const TYPES = {
  GENERIC: 'generic',        // メモのみ
  CONCEPT: 'concept',        // コンセプト/世界観メモ
  REFERENCES: 'references',  // URL群
  PALETTE: 'palette',        // カラーパレット
  EXPRESSIONS: 'expressions',// 表情チェック
  OUTFIT: 'outfit',          // 衣装パーツチェック
  CHECKLIST: 'checklist',    // 汎用チェックリスト
  ROUGH: 'rough',            // ラフ
  LINEART: 'lineart',        // 線画
  COLORING: 'coloring',      // 着色
  PARTS: 'parts',            // レイヤー分け
  CUBISM: 'cubism',          // セットアップ
  FACE: 'face',              // 顔パラメータ
  PHYSICS: 'physics',        // 物理演算
  MOTION: 'motion',          // 表情モーション
  EXPORT: 'export',          // 出力
}

// テンプレート（各項目にタイプ付与）
const VTUBER_TEMPLATE = [
  // キャラデザフェーズ
  { stage: STAGES.CHARA_DESIGN, title: '世界観・コンセプト設定', type: TYPES.CONCEPT },
  { stage: STAGES.CHARA_DESIGN, title: '参考資料・インスピレーション収集', type: TYPES.REFERENCES },
  { stage: STAGES.CHARA_DESIGN, title: 'カラーパレット決定', type: TYPES.PALETTE },
  { stage: STAGES.CHARA_DESIGN, title: '髪型・表情デザイン', type: TYPES.EXPRESSIONS },
  { stage: STAGES.CHARA_DESIGN, title: '衣装デザイン', type: TYPES.OUTFIT },
  { stage: STAGES.CHARA_DESIGN, title: 'デザイン確定', type: TYPES.CHECKLIST },
  // 立ち絵フェーズ
  { stage: STAGES.ILLUSTRATION, title: 'ラフスケッチ', type: TYPES.ROUGH },
  { stage: STAGES.ILLUSTRATION, title: '線画作成', type: TYPES.LINEART },
  { stage: STAGES.ILLUSTRATION, title: '着色・仕上げ', type: TYPES.COLORING },
  { stage: STAGES.ILLUSTRATION, title: 'パーツ別レイヤー分け', type: TYPES.PARTS },
  { stage: STAGES.ILLUSTRATION, title: '差分表情作成', type: TYPES.EXPRESSIONS },
  // Live2Dフェーズ
  { stage: STAGES.LIVE2D, title: 'Cubismセットアップ', type: TYPES.CUBISM },
  { stage: STAGES.LIVE2D, title: '顔パーツ設定', type: TYPES.FACE },
  { stage: STAGES.LIVE2D, title: '髪・服の物理演算', type: TYPES.PHYSICS },
  { stage: STAGES.LIVE2D, title: '表情モーション作成', type: TYPES.MOTION },
  { stage: STAGES.LIVE2D, title: '最終調整・出力', type: TYPES.EXPORT },
]

const TEMPLATE_TYPE_BY_TITLE = Object.fromEntries(
  VTUBER_TEMPLATE.map(t => [t.title, t.type])
)

// 各タイプのデフォルトdata
const getDefaultData = (type) => {
  switch (type) {
    case TYPES.CONCEPT:
      return { notes: '' }
    case TYPES.REFERENCES:
      return { links: '' }
    case TYPES.PALETTE:
      return { mainColor: '#ff9ec7', subColor: '#9ed4ff', notes: '' }
    case TYPES.EXPRESSIONS:
      return { items: ['通常', '喜び', '怒り', '悲しみ', '驚き', '困惑'].map(n => ({ name: n, checked: false })) }
    case TYPES.OUTFIT:
      return { items: ['トップス', 'ボトムス', '靴', 'アクセサリー', '髪飾り'].map(n => ({ name: n, checked: false })) }
    case TYPES.CHECKLIST:
      return { items: [{ name: 'チェック項目', checked: false }] }
    case TYPES.ROUGH:
      return { notes: '', items: [{ name: 'ポーズ決定', checked: false }, { name: 'アタリ作成', checked: false }] }
    case TYPES.LINEART:
      return { notes: '', items: [{ name: '主線', checked: false }, { name: '副線', checked: false }] }
    case TYPES.COLORING:
      return { notes: '', items: [{ name: 'ベース塗り', checked: false }, { name: '影つけ', checked: false }, { name: 'ハイライト', checked: false }] }
    case TYPES.PARTS:
      return { items: ['顔ベース', '目', '眉', '口', '前髪', '後ろ髪', '体', '服'].map(n => ({ name: n, checked: false })) }
    case TYPES.CUBISM:
      return { items: [{ name: 'モデル新規作成', checked: false }, { name: 'テクスチャ読込', checked: false }, { name: 'メッシュ自動生成', checked: false }] }
    case TYPES.FACE:
      return { items: ['目の開閉', '眉の動き', '口の形'].map(n => ({ name: n, checked: false })) }
    case TYPES.PHYSICS:
      return { params: [{ name: '髪揺れ', value: 50 }, { name: '服揺れ', value: 50 }] }
    case TYPES.MOTION:
      return { items: [{ name: 'まばたき', checked: false }, { name: '笑顔', checked: false }, { name: '困り顔', checked: false }] }
    case TYPES.EXPORT:
      return { items: [{ name: 'moc3書き出し', checked: false }, { name: '動作確認', checked: false }, { name: 'プレビュー動画作成', checked: false }] }
    default:
      return { notes: '' }
  }
}

export default function App() {
  // データ構造: { characters: [{id, name, color}], todosByCharacter: {characterId: [todos]} }
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // 既存データの移行処理
        if (Array.isArray(parsed)) {
          return {
            characters: [DEFAULT_CHARACTER],
            todosByCharacter: {
              [DEFAULT_CHARACTER.id]: parsed.map(t => ({ ...t, stage: t.stage || STAGES.CHARA_DESIGN }))
            }
          }
        }
        // v2 以降: 各todoに type と data を付与
        if (parsed && parsed.characters && parsed.todosByCharacter) {
          const migrated = { ...parsed }
          for (const [charId, list] of Object.entries(migrated.todosByCharacter)) {
            migrated.todosByCharacter[charId] = (list || []).map(t => {
              // すでにtype/dataがあれば保持
              if (t.type && t.data) return t
              // タイトルからタイプ推定
              const type = t.type || TEMPLATE_TYPE_BY_TITLE[t.title] || TYPES.GENERIC
              let data = t.data
              if (!data) {
                // 旧notesやlinksがあれば優先
                if (type === TYPES.REFERENCES && t.links) {
                  data = { links: t.links }
                } else if (type === TYPES.PALETTE && (t.notes || t.mainColor)) {
                  data = { mainColor: t.mainColor || '#ff9ec7', subColor: t.subColor || '#9ed4ff', notes: t.notes || '' }
                } else if (t.notes) {
                  data = { ...getDefaultData(type), notes: t.notes }
                } else {
                  data = getDefaultData(type)
                }
              }
              // 旧フィールドは残さず、dataへ集約
              const { notes, links, mainColor, subColor, ...rest } = t
              return { ...rest, type, data }
            })
          }
          return migrated
        }
        return parsed
      }
      return { characters: [DEFAULT_CHARACTER], todosByCharacter: { [DEFAULT_CHARACTER.id]: [] } }
    } catch {
      return { characters: [DEFAULT_CHARACTER], todosByCharacter: { [DEFAULT_CHARACTER.id]: [] } }
    }
  })
  
  const [currentCharacterId, setCurrentCharacterId] = useState(() => {
    return data.characters[0]?.id || DEFAULT_CHARACTER.id
  })
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const currentCharacter = data.characters.find(c => c.id === currentCharacterId) || data.characters[0]
  const todos = data.todosByCharacter[currentCharacterId] || []

  const addCharacter = (name, color = '#ff9ec7') => {
    const newChar = { id: uuidv4(), name, color }
    setData(prev => ({
      characters: [...prev.characters, newChar],
      todosByCharacter: { ...prev.todosByCharacter, [newChar.id]: [] }
    }))
    setCurrentCharacterId(newChar.id)
  }

  const updateCharacter = (id, updates) => {
    setData(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  }

  const deleteCharacter = (id) => {
    if (data.characters.length <= 1) return // 最低1キャラは残す
    const newChars = data.characters.filter(c => c.id !== id)
    const newTodos = { ...data.todosByCharacter }
    delete newTodos[id]
    setData({ characters: newChars, todosByCharacter: newTodos })
    if (currentCharacterId === id) {
      setCurrentCharacterId(newChars[0].id)
    }
  }

  const addTodo = (title, stage = STAGES.CHARA_DESIGN) => {
    const newTodo = {
      id: uuidv4(),
      title,
      stage,
      completed: false,
      createdAt: Date.now(),
      type: TYPES.GENERIC,
      data: { notes: '' },
    }
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: [newTodo, ...(prev.todosByCharacter[currentCharacterId] || [])]
      }
    }))
  }

  // 各タイプのデフォルトdata
  const getDefaultData = (type) => {
    switch (type) {
      case TYPES.CONCEPT:
        return { notes: '' }
      case TYPES.REFERENCES:
        return { links: '' }
      case TYPES.PALETTE:
        return { mainColor: '#ff9ec7', subColor: '#9ed4ff', notes: '' }
      case TYPES.EXPRESSIONS:
        return { items: ['通常', '喜び', '怒り', '悲しみ', '驚き', '困惑'].map(n => ({ name: n, checked: false })) }
      case TYPES.OUTFIT:
        return { items: ['トップス', 'ボトムス', '靴', 'アクセサリー', '髪飾り'].map(n => ({ name: n, checked: false })) }
      case TYPES.CHECKLIST:
        return { items: [{ name: 'チェック項目', checked: false }] }
      case TYPES.ROUGH:
        return { notes: '', items: [{ name: 'ポーズ決定', checked: false }, { name: 'アタリ作成', checked: false }] }
      case TYPES.LINEART:
        return { notes: '', items: [{ name: '主線', checked: false }, { name: '副線', checked: false }] }
      case TYPES.COLORING:
        return { notes: '', items: [{ name: 'ベース塗り', checked: false }, { name: '影つけ', checked: false }, { name: 'ハイライト', checked: false }] }
      case TYPES.PARTS:
        return { items: ['顔ベース', '目', '眉', '口', '前髪', '後ろ髪', '体', '服'].map(n => ({ name: n, checked: false })) }
      case TYPES.CUBISM:
        return { items: [{ name: 'モデル新規作成', checked: false }, { name: 'テクスチャ読込', checked: false }, { name: 'メッシュ自動生成', checked: false }] }
      case TYPES.FACE:
        return { items: ['目の開閉', '眉の動き', '口の形'].map(n => ({ name: n, checked: false })) }
      case TYPES.PHYSICS:
        return { params: [{ name: '髪揺れ', value: 50 }, { name: '服揺れ', value: 50 }] }
      case TYPES.MOTION:
        return { items: [{ name: 'まばたき', checked: false }, { name: '笑顔', checked: false }, { name: '困り顔', checked: false }] }
      case TYPES.EXPORT:
        return { items: [{ name: 'moc3書き出し', checked: false }, { name: '動作確認', checked: false }, { name: 'プレビュー動画作成', checked: false }] }
      default:
        return { notes: '' }
    }
  }

  const addVTuberTemplate = () => {
    const existingTitles = new Set(todos.map(t => t.title.toLowerCase().trim()))
    const missingTemplates = VTUBER_TEMPLATE.filter(
      item => !existingTitles.has(item.title.toLowerCase().trim())
    )

    if (missingTemplates.length === 0) {
      alert('すべてのテンプレート項目が既に存在します！')
      return
    }

    const templateTodos = missingTemplates.map((item) => {
      const type = item.type || TYPES.GENERIC
      return {
        id: uuidv4(),
        title: item.title,
        stage: item.stage,
        type,
        data: getDefaultData(type),
        completed: false,
        createdAt: Date.now(),
      }
    })
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: [...templateTodos, ...(prev.todosByCharacter[currentCharacterId] || [])]
      }
    }))

    if (missingTemplates.length < VTUBER_TEMPLATE.length) {
      alert(`${missingTemplates.length}個の不足項目を追加しました！`)
    }
  }

  const updateTodo = (id, updates) => {
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: prev.todosByCharacter[currentCharacterId].map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      }
    }))
  }

  const toggleTodo = (id) => {
    updateTodo(id, { completed: !todos.find(t => t.id === id)?.completed })
  }

  const deleteTodo = (id) => {
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: prev.todosByCharacter[currentCharacterId].filter(t => t.id !== id)
      }
    }))
  }

  const reorderTodos = (startIndex, endIndex) => {
    const result = Array.from(todos)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: result
      }
    }))
  }

  const clearCompleted = () => {
    setData(prev => ({
      ...prev,
      todosByCharacter: {
        ...prev.todosByCharacter,
        [currentCharacterId]: prev.todosByCharacter[currentCharacterId].filter(t => !t.completed)
      }
    }))
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    reorderTodos(result.source.index, result.destination.index)
  }

  const filtered = useMemo(() => {
    let result = todos
    // ステータスフィルタ
    if (statusFilter === 'active') result = result.filter((t) => !t.completed)
    if (statusFilter === 'done') result = result.filter((t) => t.completed)
    // ステージフィルタ
    if (stageFilter !== 'all') result = result.filter((t) => t.stage === stageFilter)
    return result
  }, [todos, statusFilter, stageFilter])

  const stats = useMemo(() => {
    const byStage = {}
    Object.values(STAGES).forEach(stage => {
      const stageTodos = todos.filter(t => t.stage === stage)
      byStage[stage] = {
        done: stageTodos.filter(t => t.completed).length,
        total: stageTodos.length,
      }
    })
    return {
      all: { done: todos.filter(t => t.completed).length, total: todos.length },
      ...byStage,
    }
  }, [todos])

  const today = format(new Date(), 'PPPP', { locale: ja })

  return (
    <div className="container">
      <h1>✨ VTuber Assist ToDo ✨</h1>
      <p className="subtitle">最強のVTuberを生み出すための制作管理</p>

      <CharacterSelector
        characters={data.characters}
        currentCharacter={currentCharacter}
        onSelectCharacter={setCurrentCharacterId}
        onAddCharacter={addCharacter}
        onUpdateCharacter={updateCharacter}
        onDeleteCharacter={deleteCharacter}
      />

      <div className="progress-bar">
        <div className="progress-item">
          <span className="emoji">📋</span>
          <span>全体: <span className="count">{stats.all.done}/{stats.all.total}</span></span>
        </div>
        {Object.entries(STAGE_LABELS).map(([stage, label]) => (
          <div key={stage} className="progress-item">
            <span className="emoji">{label.split(' ')[0]}</span>
            <span>{label.split(' ')[1]}: <span className="count">{stats[stage]?.done || 0}/{stats[stage]?.total || 0}</span></span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters top">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={statusFilter === 'all' ? 'active' : ''}
          >
            すべて
          </button>
          <button 
            onClick={() => setStatusFilter('active')} 
            className={statusFilter === 'active' ? 'active' : ''}
          >
            未完了
          </button>
          <button 
            onClick={() => setStatusFilter('done')} 
            className={statusFilter === 'done' ? 'active' : ''}
          >
            完了済
          </button>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,158,199,0.2)', margin: '8px 0' }} />
          {Object.entries(STAGE_LABELS).map(([stage, label]) => (
            <button 
              key={stage}
              onClick={() => setStageFilter(stage)} 
              className={stageFilter === stage ? 'active' : ''}
            >
              {label}
            </button>
          ))}
          <button 
            onClick={() => setStageFilter('all')} 
            className={stageFilter === 'all' ? 'active' : ''}
          >
            全フェーズ
          </button>
          <div className="spacer" />
          <button className="danger" onClick={clearCompleted} disabled={stats.all.done === 0}>
            完了を一括削除
          </button>
        </div>

        <button className="template-btn" onClick={addVTuberTemplate}>
          🎯 VTuber制作テンプレートを不足分だけ追加（{VTUBER_TEMPLATE.length}項目）
        </button>

        <TodoInput onAdd={addTodo} stages={STAGES} stageLabels={STAGE_LABELS} />
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <TodoList 
                  todos={filtered} 
                  onToggle={toggleTodo} 
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                  stageLabels={STAGE_LABELS} 
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <p className="meta" style={{ textAlign: 'center', marginTop: '20px' }}>{today}</p>
    </div>
  )
}
