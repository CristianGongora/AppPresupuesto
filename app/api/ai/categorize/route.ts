import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const transactionSchema = z.object({
  amount: z.number().describe('The monetary amount extracted from the text'),
  type: z.enum(['income', 'expense']).describe('Whether this is an income or expense'),
  description: z.string().describe('A brief description of the transaction'),
  suggestedCategory: z.string().describe('The most appropriate category name for this transaction'),
})

export async function POST(req: Request) {
  try {
    const { text, categories, language = 'es' } = await req.json()

    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 })
    }

    // Get user's categories for context
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let availableCategories: string[] = categories || []
    
    if (user && !categories) {
      const { data: userCategories } = await supabase
        .from('categories')
        .select('name, type')
        .eq('user_id', user.id)
      
      if (userCategories) {
        availableCategories = userCategories.map(c => `${c.name} (${c.type})`)
      }
    }

    const languageInstructions = {
      es: 'Responde en español.',
      en: 'Respond in English.',
      pt: 'Responda em português.',
    }

    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: transactionSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a financial assistant that extracts transaction information from natural language.
Extract the amount, determine if it's an income or expense, create a brief description, and suggest the most appropriate category.

Available categories: ${availableCategories.join(', ')}

Rules:
- If the user mentions receiving money, salary, payment for work, or similar, it's an INCOME
- If the user mentions spending, buying, paying for something, bills, or similar, it's an EXPENSE
- Extract the exact amount mentioned. If no currency symbol, assume the local currency.
- For the description, be concise (2-5 words max)
- For the category, choose from the available categories or suggest a similar one if none match

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.es}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    })

    return Response.json({ 
      success: true,
      transaction: output 
    })
  } catch (error) {
    console.error('Error in categorize API:', error)
    return Response.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    )
  }
}
