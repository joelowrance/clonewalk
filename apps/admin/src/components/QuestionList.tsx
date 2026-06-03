'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from './QuestionList.module.css'

type AnswerType = 'true_false' | 'scored' | 'multiple_choice' | 'photo' | 'file'

const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  true_false:      'True/False',
  scored:          'Scored',
  multiple_choice: 'Multiple Choice',
  photo:           'Photo',
  file:            'File',
}

interface Question {
  id:              string
  text:            string
  answerType:      AnswerType
  pointValue:      number
  scoredMinValue:  number | null
  scoredMaxValue:  number | null
  isCritical:      boolean
  position:        number
}

interface FormState {
  text:            string
  answerType:      AnswerType
  pointValue:      string
  scoredMinValue:  string
  scoredMaxValue:  string
  isCritical:      boolean
}

const EMPTY_FORM: FormState = { text: '', answerType: 'true_false', pointValue: '0', scoredMinValue: '0', scoredMaxValue: '10', isCritical: false }

function SortableRow({
  question,
  onEdit,
  onDelete,
}: {
  question: Question
  onEdit:   (q: Question) => void
  onDelete: (q: Question) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={rowStyle}
      className={styles.row}
      data-testid="question-row"
    >
      <td className={styles.handleCell}>
        <button
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
          data-testid="drag-handle"
          aria-label="Drag to reorder"
          type="button"
        >
          ⠿
        </button>
      </td>
      <td className={styles.textCell}>{question.text}</td>
      <td className={styles.cell}>{ANSWER_TYPE_LABELS[question.answerType]}</td>
      <td className={styles.cell}>{question.pointValue}</td>
      <td className={styles.cell} data-testid="question-range">
        {question.answerType === 'scored' && question.scoredMinValue !== null && question.scoredMaxValue !== null
          ? `${question.scoredMinValue}–${question.scoredMaxValue}`
          : '—'}
      </td>
      <td className={styles.cell}>{question.isCritical ? 'Critical' : '—'}</td>
      <td className={styles.actionsCell}>
        <button className={styles.editBtn} onClick={() => onEdit(question)} type="button">Edit</button>
        <button className={styles.deleteBtn} onClick={() => onDelete(question)} type="button">Delete</button>
      </td>
    </tr>
  )
}

function QuestionFormModal({
  title,
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  title:    string
  initial:  FormState
  onSave:   (f: FormState) => void
  onCancel: () => void
  saving:   boolean
  error:    string | null
}) {
  const [form, setForm] = useState<FormState>(initial)

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>{title}</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="q-text">Question text</label>
          <input
            id="q-text"
            className={styles.input}
            data-testid="question-text-input"
            value={form.text}
            onChange={e => set('text', e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="q-type">Answer type</label>
          <select
            id="q-type"
            className={styles.select}
            data-testid="answer-type-select"
            value={form.answerType}
            onChange={e => set('answerType', e.target.value as AnswerType)}
            disabled={saving}
          >
            {(Object.keys(ANSWER_TYPE_LABELS) as AnswerType[]).map(t => (
              <option key={t} value={t}>{ANSWER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="q-points">Point value</label>
          <input
            id="q-points"
            type="number"
            min={0}
            className={styles.input}
            data-testid="point-value-input"
            value={form.pointValue}
            onChange={e => set('pointValue', e.target.value)}
            disabled={saving}
          />
        </div>

        {form.answerType === 'scored' && (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="q-min">Min value</label>
              <input
                id="q-min"
                type="number"
                className={styles.input}
                data-testid="scored-min-input"
                value={form.scoredMinValue}
                onChange={e => set('scoredMinValue', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="q-max">Max value</label>
              <input
                id="q-max"
                type="number"
                className={styles.input}
                data-testid="scored-max-input"
                value={form.scoredMaxValue}
                onChange={e => set('scoredMaxValue', e.target.value)}
                disabled={saving}
              />
            </div>
          </>
        )}

        <div className={styles.checkRow}>
          <input
            id="q-critical"
            type="checkbox"
            data-testid="is-critical-checkbox"
            checked={form.isCritical}
            onChange={e => set('isCritical', e.target.checked)}
            disabled={saving}
          />
          <label htmlFor="q-critical" className={styles.label}>Critical question</label>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancel} onClick={onCancel} disabled={saving} type="button">Cancel</button>
          <button className={styles.submit} onClick={() => onSave(form)} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  question,
  onConfirm,
  onCancel,
  deleting,
}: {
  question: Question
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Delete question?</h2>
        <p className={styles.confirmText}>
          &ldquo;{question.text}&rdquo; will be permanently removed.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.cancel} onClick={onCancel} disabled={deleting} type="button">Cancel</button>
          <button className={styles.deleteConfirm} onClick={onConfirm} disabled={deleting} type="button">
            {deleting ? 'Deleting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function QuestionList({ surveyId }: { surveyId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [addOpen, setAddOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const load = useCallback(async () => {
    const res = await fetch(`/api/surveys/${surveyId}/questions`)
    if (res.ok) {
      const body = await res.json() as { questions: Question[] }
      setQuestions(body.questions)
    }
    setLoading(false)
  }, [surveyId])

  useEffect(() => { void load() }, [load])

  async function handleAdd(form: FormState) {
    if (!form.text.trim()) { setFormError('Question text is required'); return }
    setSaving(true)
    setFormError(null)
    const body: Record<string, unknown> = {
      text: form.text.trim(),
      answerType: form.answerType,
      pointValue: parseInt(form.pointValue, 10) || 0,
      isCritical: form.isCritical,
    }
    if (form.answerType === 'scored') {
      body['scoredMinValue'] = parseInt(form.scoredMinValue, 10)
      body['scoredMaxValue'] = parseInt(form.scoredMaxValue, 10)
    }
    const res = await fetch(`/api/surveys/${surveyId}/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const body = await res.json() as { question: Question }
      setQuestions(prev => [...prev, body.question])
      setAddOpen(false)
    } else {
      setFormError('Failed to save question')
    }
  }

  async function handleEdit(form: FormState) {
    if (!editTarget) return
    if (!form.text.trim()) { setFormError('Question text is required'); return }
    setSaving(true)
    setFormError(null)
    const body: Record<string, unknown> = {
      text: form.text.trim(),
      answerType: form.answerType,
      pointValue: parseInt(form.pointValue, 10) || 0,
      isCritical: form.isCritical,
    }
    if (form.answerType === 'scored') {
      body['scoredMinValue'] = parseInt(form.scoredMinValue, 10)
      body['scoredMaxValue'] = parseInt(form.scoredMaxValue, 10)
    }
    const res = await fetch(`/api/surveys/${surveyId}/questions/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const body = await res.json() as { question: Question }
      setQuestions(prev => prev.map(q => q.id === body.question.id ? body.question : q))
      setEditTarget(null)
    } else {
      setFormError('Failed to save question')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/surveys/${surveyId}/questions/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex(q => q.id === active.id)
    const newIndex = questions.findIndex(q => q.id === over.id)
    const reordered = arrayMove(questions, oldIndex, newIndex)
    setQuestions(reordered)

    await fetch(`/api/surveys/${surveyId}/questions/reorder`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map(q => q.id) }),
    })
  }

  if (loading) return <p>Loading questions…</p>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Questions</h2>
        <button className={styles.addBtn} onClick={() => { setAddOpen(true); setFormError(null) }} type="button">
          Add question
        </button>
      </div>

      {questions.length === 0 ? (
        <p className={styles.empty}>No questions yet</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} />
                  <th className={styles.th}>Question</th>
                  <th className={styles.th}>Answer Type</th>
                  <th className={styles.th}>Points</th>
                  <th className={styles.th}>Range</th>
                  <th className={styles.th}>Critical</th>
                  <th className={styles.th} />
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <SortableRow
                    key={q.id}
                    question={q}
                    onEdit={q => { setEditTarget(q); setFormError(null) }}
                    onDelete={q => setDeleteTarget(q)}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}

      {addOpen && (
        <QuestionFormModal
          title="Add question"
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setAddOpen(false)}
          saving={saving}
          error={formError}
        />
      )}

      {editTarget && (
        <QuestionFormModal
          title="Edit question"
          initial={{ text: editTarget.text, answerType: editTarget.answerType, pointValue: String(editTarget.pointValue), scoredMinValue: String(editTarget.scoredMinValue ?? 0), scoredMaxValue: String(editTarget.scoredMaxValue ?? 10), isCritical: editTarget.isCritical }}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
          saving={saving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          question={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
