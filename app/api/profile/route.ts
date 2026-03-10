import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Intenta obtener el perfil
    const { data: profile, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Si el perfil no existe, crea uno por defecto
    if (selectError && selectError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'es',
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: 'Error al crear el perfil', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ...newProfile,
        display_name: newProfile.full_name,
      })
    }

    if (selectError) {
      return NextResponse.json(
        { error: 'Error al obtener el perfil', details: selectError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...profile,
      display_name: profile.full_name,
    })
  } catch (error) {
    console.error('[v0] Error en GET profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('[v0] POST /api/profile - User:', user?.id, userError)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name, currency, timezone, language } = body
    console.log('[v0] Profile update data:', { display_name, currency, timezone, language })

    // Primero intenta actualizar
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: display_name,
        currency,
        timezone,
        language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    console.log('[v0] Update result:', { updated, updateError })

    if (updateError) {
      console.log('[v0] Update error code:', updateError.code, updateError.message)
      // Si falla porque no existe, inserta
      if (updateError.code === 'PGRST116') {
        const { data: inserted, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            full_name: display_name,
            currency,
            timezone,
            language,
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single()

        console.log('[v0] Insert result:', { inserted, insertError })

        if (insertError) {
          console.log('[v0] Insert error:', insertError.message)
          return NextResponse.json(
            { error: 'Error al guardar el perfil', details: insertError.message },
            { status: 500 }
          )
        }

        return NextResponse.json(inserted)
      }

      console.log('[v0] Returning update error:', updateError.message)
      return NextResponse.json(
        { error: 'Error al actualizar el perfil', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[v0] Error en POST profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Desconocido' },
      { status: 500 }
    )
  }
}
