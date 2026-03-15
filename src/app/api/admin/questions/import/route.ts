import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, requireAdmin } from '@/lib/auth'
import Question from '@/models/Question'
import { questionSchema } from '@/validations/questionSchema'
import mongoose from 'mongoose'
import Papa from 'papaparse'

function parseRow(row: Record<string, string>) {
  const rawOptions = row.options ? row.options.split('|').map((s: string) => s.trim()).filter(Boolean) : []
  const tags = row.tags ? row.tags.split('|').map((s: string) => s.trim()).filter(Boolean) : []
  const points = row.points ? parseFloat(row.points) : 1
  const questionType = row.questionType?.trim()
  const correctAnswer = row.correctAnswer?.trim() || undefined

  // word_order: options column = pipe-separated words, correctAnswer = correct sentence
  const words = questionType === 'word_order' ? rawOptions : undefined
  const correctOrder = questionType === 'word_order' && correctAnswer
    ? correctAnswer.split(' ').map((s: string) => s.trim()).filter(Boolean)
    : undefined

  // fill_blank: build blanks from correctAnswer
  const blanks = questionType === 'fill_blank' && correctAnswer
    ? [{ index: 0, answer: correctAnswer }]
    : undefined

  // matching: parse "left:right|left:right" from options column
  const matchingPairs = questionType === 'matching' && rawOptions.length
    ? rawOptions.map((pair: string) => {
        const sep = pair.indexOf(':')
        return sep > -1
          ? { left: pair.slice(0, sep).trim(), right: pair.slice(sep + 1).trim() }
          : { left: pair.trim(), right: '' }
      }).filter((p: { left: string; right: string }) => p.left && p.right)
    : undefined

  // For non-word_order types, options stays as-is
  const options = (questionType !== 'word_order' && rawOptions.length) ? rawOptions : undefined

  return {
    examType: row.examType?.trim(),
    section: row.section?.trim(),
    questionType,
    difficulty: row.difficulty?.trim(),
    points,
    question: row.question?.trim(),
    passage: row.passage?.trim() || undefined,
    options,
    words,
    correctAnswer: (questionType === 'fill_blank' || questionType === 'word_order') ? undefined : correctAnswer,
    correctOrder,
    blanks,
    matchingPairs,
    explanation: row.explanation?.trim() || undefined,
    tags,
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const payload = requireAuth(req)!
    await connectDB()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const rawText = await file.text()
    // Strip UTF-8 BOM and comment lines (lines starting with #)
    const text = rawText
      .replace(/^\uFEFF/, '')
      .split('\n')
      .filter(line => !line.trimStart().startsWith('#'))
      .join('\n')
    const { data: rows } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    })

    const valid: Record<string, unknown>[] = []
    const errors: { row: number; message: string }[] = []

    rows.forEach((row, i) => {
      const parsed = questionSchema.safeParse(parseRow(row))
      if (parsed.success) {
        valid.push({
          ...parsed.data,
          createdBy: new mongoose.Types.ObjectId(payload.userId),
          isCustom: false,
          visibility: 'public',
        })
      } else {
        errors.push({
          row: i + 2,
          message: parsed.error.issues.map((e: { message: string }) => e.message).join('; '),
        })
      }
    })

    let inserted = 0
    if (valid.length > 0) {
      const result = await Question.insertMany(valid, { ordered: false })
      inserted = result.length
    }

    return NextResponse.json({
      success: true,
      data: {
        inserted,
        failed: errors.length,
        errors,
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
