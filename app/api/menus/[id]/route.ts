import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/menus/[id] - Get a specific menu
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch menu (RLS will handle permissions)
        const { data: menu, error } = await supabase
            .from('menus')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching menu:', error)
            return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
        }

        // Check if user has access (owner or public menu)
        if (menu.user_id !== user?.id && !menu.is_public) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        return NextResponse.json({ menu })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/menus/[id] - Update a menu
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Update menu (RLS will ensure user owns it)
        const { data: menu, error } = await supabase
            .from('menus')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating menu:', error)
            return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 })
        }

        return NextResponse.json({ menu })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/menus/[id] - Delete a menu
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete menu (RLS will ensure user owns it)
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error deleting menu:', error)
            return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
