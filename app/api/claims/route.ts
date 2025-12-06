import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/claims - List claims for user
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const status = searchParams.get('status')

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('claims')
      .select(`
        *,
        item:items(
          id, title, type, status,
          user:profiles(id, name, avatar_url)
        ),
        claimant:profiles(id, name, avatar_url, is_verified),
        evidence:claim_evidence(*)
      `)
      .or(`claimant_id.eq.${user.id},item.user_id.eq.${user.id}`)

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ claims: data })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

// POST /api/claims - Create claim
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { item_id, secret_info, proof_description } = body
    if (!item_id || !secret_info) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if item exists and is claimable
    const { data: item } = await supabase
      .from('items')
      .select('id, type, user_id, status')
      .eq('id', item_id)
      .single() as { data: any }

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if ((item as any).status !== 'active') {
      return NextResponse.json(
        { error: 'Item is not available for claiming' },
        { status: 400 }
      )
    }

    if ((item as any).user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot claim your own item' },
        { status: 400 }
      )
    }

    // Check for existing pending claim
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('id')
      .eq('item_id', item_id)
      .eq('claimant_id', user.id)
      .eq('status', 'pending')
      .single() as { data: any }

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You already have a pending claim for this item' },
        { status: 400 }
      )
    }

    // Create claim
    const { data: claim, error } = await (supabase.from('claims') as any)
      .insert({
        item_id,
        claimant_id: user.id,
        secret_info,
        proof_description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Handle evidence uploads if provided
    if (body.evidence && Array.isArray(body.evidence)) {
      const evidenceData = body.evidence.map((e: any) => ({
        claim_id: claim.id,
        type: e.type,
        url: e.url,
        description: e.description,
      }))

      await (supabase.from('claim_evidence') as any).insert(evidenceData)
    }

    // Create notification for item owner
    await (supabase.from('notifications') as any).insert({
      user_id: (item as any).user_id,
      type: 'new_claim',
      title: 'New Claim Received',
      body: 'Someone has claimed your item. Review their claim now.',
      data: { claim_id: claim.id, item_id: (item as any).id },
    })

    // Update item status
    await (supabase.from('items') as any)
      .update({ status: 'claimed' })
      .eq('id', item_id)

    return NextResponse.json({ claim }, { status: 201 })
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}
