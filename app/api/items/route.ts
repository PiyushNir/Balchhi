import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/items - List items with filters
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  // Parse query parameters
  const type = searchParams.get('type') // lost | found
  const category = searchParams.get('category')
  const province = searchParams.get('province')
  const district = searchParams.get('district')
  const status = searchParams.get('status') || 'active'
  const verified = searchParams.get('verified')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  try {
    let query = supabase
      .from('items')
      .select(`
        *,
        category:categories(*),
        user:profiles(id, name, avatar_url, is_verified),
        media:item_media(*)
      `, { count: 'exact' })
      .eq('status', status)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (province) {
      query = query.contains('location', { province })
    }

    if (district) {
      query = query.contains('location', { district })
    }

    if (verified === 'true') {
      query = query.eq('is_verified_listing', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const { type, title, description, category_id, location, date_lost_found } = body
    if (!type || !title || !description || !category_id || !location || !date_lost_found) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is verified for verified listing
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single()

    const itemData = {
      type,
      title,
      description,
      category_id,
      location,
      date_lost_found,
      time_lost_found: body.time_lost_found,
      reward_amount: body.reward_amount,
      contact_phone: body.contact_phone,
      contact_email: body.contact_email,
      show_contact: body.show_contact ?? true,
      user_id: user.id,
      organization_id: body.organization_id,
      storage_location: body.storage_location,
      retention_date: body.retention_date,
      is_verified_listing: (profile as any)?.is_verified ?? false,
    }

    const { data: item, error } = await (supabase
      .from('items') as any)
      .insert(itemData)
      .select(`
        *,
        category:categories(*),
        user:profiles(id, name, avatar_url, is_verified)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Handle media uploads if provided
    if (body.media && Array.isArray(body.media)) {
      const mediaData = body.media.map((m: any, index: number) => ({
        item_id: item.id,
        url: m.url,
        thumbnail_url: m.thumbnail_url,
        is_primary: index === 0,
        order: index,
      }))

      await (supabase.from('item_media') as any).insert(mediaData)
    }

    // Log activity
    await (supabase.from('activity_logs') as any).insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'item',
      entity_id: item.id,
      details: { type, title },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
