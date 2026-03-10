import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 30

const SYSTEM_PROMPT = `Eres un asistente financiero personal experto y amigable llamado "FinanceAI". Tu objetivo es ayudar a los usuarios a mejorar su salud financiera.

PERSONALIDAD:
- Eres amable, profesional y motivador
- Usas un lenguaje claro y accesible
- Ofreces consejos prácticos y accionables
- Celebras los logros financieros del usuario
- Eres empático con las dificultades financieras

CAPACIDADES:
- Analizar patrones de gastos e ingresos
- Identificar áreas de mejora en el presupuesto
- Sugerir estrategias de ahorro personalizadas
- Dar consejos sobre planificación financiera
- Explicar conceptos financieros de forma simple
- Motivar a alcanzar metas financieras
- Ayudar con gestión de créditos, cuentas bancarias y CDTs

FORMATO DE RESPUESTAS:
- Responde en español
- Sé conciso pero completo (máximo 3-4 párrafos)
- Usa bullets o números para listas
- Incluye ejemplos concretos cuando sea útil
- Termina con una pregunta o sugerencia de acción

IMPORTANTE:
- Nunca des consejos de inversión específicos
- Recomienda consultar profesionales para decisiones importantes
- Basa tus análisis en los datos financieros proporcionados
- Si no tienes suficiente información, pregunta antes de asumir`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[v0] AI Chat received body keys:', Object.keys(body))
    
    const { messages, financialContext } = body as { messages: UIMessage[]; financialContext?: string }
    
    if (!messages || !Array.isArray(messages)) {
      console.log('[v0] No messages received or invalid format')
      return new Response(
        JSON.stringify({ error: 'No se recibieron mensajes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[v0] Processing', messages.length, 'messages')
    console.log('[v0] Financial context present:', !!financialContext)

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: `${SYSTEM_PROMPT}\n\n${financialContext || 'No hay contexto financiero disponible.'}`,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[v0] Error in AI chat:', error)
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud de IA', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
