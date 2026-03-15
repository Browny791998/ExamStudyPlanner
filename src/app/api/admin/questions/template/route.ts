import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

function buildRows(examType: string): string[][] {
  const sectionMap: Record<string, { reading: string; writing: string; vocab: string; grammar: string; math: string }> = {
    IELTS: { reading: 'Reading', writing: 'Writing', vocab: 'Vocabulary', grammar: 'Grammar', math: 'Reading' },
    TOEFL: { reading: 'Reading', writing: 'Writing', vocab: 'Vocabulary', grammar: 'Grammar', math: 'Reading' },
    JLPT:  { reading: 'Reading', writing: 'Writing', vocab: 'Vocabulary', grammar: 'Grammar', math: 'Reading' },
    SAT:   { reading: 'Reading', writing: 'Writing', vocab: 'Reading',    grammar: 'Writing', math: 'Math' },
  }
  const s = sectionMap[examType] ?? sectionMap['IELTS']

  const passage = examType === 'JLPT'
    ? '東京は日本の首都です。毎年多くの観光客が訪れます。'
    : examType === 'SAT'
      ? 'The following passage is adapted from a 2023 science article about renewable energy.'
      : 'Read the following passage carefully before answering the questions.'

  return [
    [examType, s.reading, 'multiple_choice', 'medium', '1',
      'What is the main purpose of the passage?', passage,
      'A. To inform readers about history|B. To persuade readers to act|C. To describe a scientific process|D. To entertain with a story',
      'C', 'The passage describes a step-by-step scientific process, making C the correct answer.', 'reading|comprehension'],

    [examType, s.reading, 'true_false_ng', 'easy', '1',
      'The author believes renewable energy is important for the future.', passage,
      '', 'TRUE', 'The author explicitly states that renewable energy is vital for sustainable development.', 'reading|true-false'],

    [examType, s.vocab, 'fill_blank', 'easy', '1',
      'Water _____ at 100 degrees Celsius under normal atmospheric pressure.', '',
      '', 'boils', 'The correct word is "boils".', 'vocabulary|science'],

    [examType, s.grammar, 'word_order', 'medium', '1',
      'Arrange the words to form a correct sentence.', '',
      'the|cat|sat|on|the|mat', 'the cat sat on the mat',
      'Subject-Verb-Prepositional phrase structure.', 'grammar|sentence-structure'],

    [examType, s.vocab, 'matching', 'medium', '1',
      'Match each word with its correct definition.', '',
      'abundant:existing in large quantities|swift:moving with great speed|fragile:easily broken or damaged', '',
      'Match each vocabulary word to its meaning using the pairs provided.', 'vocabulary|matching'],

    [examType, s.writing, 'essay', 'hard', '3',
      'Discuss the advantages and disadvantages of social media. Give reasons and include relevant examples.', '',
      '', '', 'A good answer covers both sides with clear examples and a balanced conclusion.', 'writing|essay'],

    [examType, examType === 'SAT' ? s.math : s.reading, 'grid_in', 'hard', '2',
      examType === 'SAT' ? 'If 3x + 7 = 22, what is the value of x?' : 'How many paragraphs does the passage contain?', '',
      '', examType === 'SAT' ? '5' : '4',
      examType === 'SAT' ? 'Solving: 3x = 15, so x = 5.' : 'Count the paragraph breaks in the passage.',
      examType === 'SAT' ? 'math|algebra' : 'reading|numeric'],
  ]
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const VALID_EXAM_TYPES = ['IELTS', 'TOEFL', 'JLPT', 'SAT']

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { searchParams } = new URL(req.url)
    const examType = (searchParams.get('examType') ?? '').toUpperCase()

    if (!examType || !VALID_EXAM_TYPES.includes(examType)) {
      return NextResponse.json(
        { success: false, error: `examType is required. Must be one of: ${VALID_EXAM_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const headerLine = 'examType,section,questionType,difficulty,points,question,passage,options,correctAnswer,explanation,tags'
    const dataRows = buildRows(examType).map(row => row.map(escapeCsv).join(','))

    const notes = [
      '# NOTES:',
      `# examType: Must be exactly "${examType}"`,
      '# questionType: multiple_choice | true_false_ng | fill_blank | word_order | matching | essay | grid_in',
      '# difficulty: easy | medium | hard',
      '# options column usage by type:',
      '#   multiple_choice: pipe-separated choices. Example: A. text|B. text|C. text|D. text',
      '#   word_order: pipe-separated words to rearrange. Example: the|cat|sat|on|the|mat',
      '#   matching: pipe-separated "left:right" pairs. Example: word1:definition1|word2:definition2',
      '#   fill_blank / true_false_ng / grid_in / essay: leave options empty',
      '# correctAnswer column usage by type:',
      '#   multiple_choice: A / B / C / D',
      '#   true_false_ng: TRUE / FALSE / NOT GIVEN',
      '#   fill_blank: the answer word/phrase (e.g. boils)',
      '#   word_order: the full correct sentence (e.g. the cat sat on the mat)',
      '#   grid_in: numeric value (e.g. 5)',
      '#   matching / essay: leave correctAnswer empty',
      '# tags: pipe-separated. Example: reading|vocabulary',
      '#',
    ].join('\n')

    const csv = notes + '\n' + headerLine + '\n' + dataRows.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${examType}_questions_template.csv"`,
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
