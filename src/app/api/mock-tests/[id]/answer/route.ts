import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import MockTest from '@/models/MockTest'
import Question from '@/models/Question'
import mongoose from 'mongoose'

function gradeAnswer(
  questionType: string,
  userAnswer: string | string[],
  correctAnswer: string | undefined,
  correctOrder: string[] | undefined,
  blanks: { index: number; answer: string }[] | undefined,
  matchingPairs?: { left: string; right: string }[],
): boolean | null {
  if (questionType === 'essay') return null

  if (questionType === 'multiple_choice') {
    return typeof userAnswer === 'string' && userAnswer === correctAnswer
  }

  if (questionType === 'true_false_ng') {
    return typeof userAnswer === 'string' &&
      userAnswer.toUpperCase() === (correctAnswer ?? '').toUpperCase()
  }

  if (questionType === 'fill_blank') {
    // userAnswer can be string (single blank) or string[] (multiple blanks)
    const answers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
    if (blanks?.length) {
      return blanks.every((blank, i) => {
        const ua = (answers[i] ?? '').toString().trim().toLowerCase()
        return ua === blank.answer.trim().toLowerCase()
      })
    }
    // Fallback: compare against correctAnswer if no blanks defined
    if (correctAnswer) {
      return answers[0]?.toString().trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    }
    return false
  }

  if (questionType === 'word_order') {
    if (!Array.isArray(userAnswer)) return false
    // correctOrder may be stored as a string "word1 word2 word3" or as an array
    const orderArray: string[] = Array.isArray(correctOrder)
      ? correctOrder
      : typeof correctOrder === 'string'
        ? (correctOrder as string).split(/[\s,]+/).filter(Boolean)
        : []
    if (!orderArray.length) return false
    return JSON.stringify(userAnswer.map(w => w.trim())) === JSON.stringify(orderArray.map(w => w.trim()))
  }

  if (questionType === 'grid_in') {
    if (typeof userAnswer !== 'string') return false
    const ua = parseFloat(userAnswer.replace('/', '.'))
    const ca = parseFloat(correctAnswer ?? '')
    return !isNaN(ua) && !isNaN(ca) && Math.abs(ua - ca) < 0.001
  }

  if (questionType === 'matching') {
    if (!Array.isArray(userAnswer) || !matchingPairs?.length) return false
    return matchingPairs.every((pair, i) => userAnswer[i] === pair.right)
  }

  return false
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const { questionId, userAnswer, timeSpentSecs, flagged } = body as {
      questionId: string
      userAnswer: string | string[]
      timeSpentSecs: number
      flagged?: boolean
    }

    const test = await MockTest.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
      status: 'in_progress',
    })
    if (!test) return NextResponse.json({ success: false, error: 'Test not found or not in progress' }, { status: 404 })

    const question = await Question.findById(new mongoose.Types.ObjectId(questionId)).lean()
    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })

    const isCorrect = gradeAnswer(
      question.questionType,
      userAnswer,
      question.correctAnswer,
      question.correctOrder,
      question.blanks as { index: number; answer: string }[] | undefined,
      question.matchingPairs as { left: string; right: string }[] | undefined,
    )

    const pointsEarned = isCorrect === true ? (question.points ?? 1) : 0

    // Update the question embed in the test
    const qIdx = test.questions.findIndex(q => q.questionId.toString() === questionId)
    if (qIdx !== -1) {
      test.questions[qIdx].userAnswer = userAnswer
      test.questions[qIdx].isCorrect = isCorrect
      test.questions[qIdx].pointsEarned = pointsEarned
      test.questions[qIdx].timeSpentSecs = timeSpentSecs
      if (typeof flagged === 'boolean') test.questions[qIdx].flagged = flagged
    }

    // Recalculate earnedPoints
    test.earnedPoints = test.questions.reduce((sum, q) => sum + q.pointsEarned, 0)
    test.markModified('questions')
    await test.save()

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        pointsEarned,
        explanation: question.explanation,
      },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
