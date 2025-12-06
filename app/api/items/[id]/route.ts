import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { id } = await params

  try {
    const { data: item, error } = await supabase
      .from('items')
      .select(`
        *,
        category:categories(*),
        user:profiles(id, name, avatar_url, is_verified, phone),
        organization:organizations(id, name, logo_url, is_verified),
        media:item_media(*)
      `)
      .eq('id', id)
      .single() as { data: any, error: any }

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment view count (ignore type error for RPC)
    await (supabase as any).rpc('increment_item_views', { item_uuid: id })

    // Mask phone number if not show_contact
    if (!item.show_contact && item.user) {
      item.user.phone = null
      item.contact_phone = null
      item.contact_email = null
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PATCH /api/items/[id] - Update item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { id } = await params

  try {
    const body = await request.json()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const { data: existingItem } = await supabase
      .from('items')
      .select('user_id')
      .eq('id', id)
      .single() as { data: any }

    if (!existingItem || (existingItem as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update item
    const { data: item, error } = await (supabase.from('items') as any)
      .update({
        title: body.title,
        description: body.description,
        category_id: body.category_id,
        location: body.location,
        date_lost_found: body.date_lost_found,
        time_lost_found: body.time_lost_found,
        reward_amount: body.reward_amount,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        show_contact: body.show_contact,
        status: body.status,
        storage_location: body.storage_location,
        retention_date: body.retention_date,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { id } = await params

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const { data: existingItem } = await supabase
      .from('items')
      .select('user_id')
      .eq('id', id)
      .single() as { data: any }

    if (!existingItem || (existingItem as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    const { error } = await (supabase.from('items') as any)
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
