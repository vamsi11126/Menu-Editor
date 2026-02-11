import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'

// GET /api/menus - List all user's menus
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch user's menus
        const { data: menus, error } = await supabase
            .from('menus')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error fetching menus:', error)
            return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
        }

        return NextResponse.json({ menus })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/menus - Create a new menu
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title = 'Untitled Menu' } = body

        // Generate unique slug
        const slug = generateSlug(title)

        // Create new menu with default values
        const newMenu = {
            user_id: user.id,
            title,
            slug,
            is_public: false,
            canvas_size: { width: 600, height: 800 },
            background_color: '#f8f9fa',
            background_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect fill='%23f8f9fa' width='600' height='800'/%3E%3Ctext x='300' y='80' font-family='Arial' font-size='32' fill='%23333' text-anchor='middle' font-weight='bold'%3ERestaurant Menu%3C/text%3E%3Crect x='50' y='120' width='500' height='2' fill='%23ddd'/%3E%3C/svg%3E",
            sections: [],
            individual_items: [],
            lines: [],
            images: [],
            item_spacing: 50,
            uniform_section_size: { width: 400, height: 300 },
            price_memory: {},
        }

        const { data: menu, error } = await supabase
            .from('menus')
            .insert(newMenu)
            .select()
            .single()

        if (error) {
            console.error('Error creating menu:', error)
            return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
        }

        return NextResponse.json({ menu }, { status: 201 })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
