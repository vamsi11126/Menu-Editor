import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

// POST /api/menus/[id]/qr - Generate QR code for menu
export async function POST(
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

        // Get menu
        const { data: menu, error: menuError } = await supabase
            .from('menus')
            .select('slug, user_id')
            .eq('id', id)
            .single()

        if (menuError || !menu) {
            return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
        }

        // Check ownership
        if (menu.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Generate QR code
        const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/menu/${menu.slug}`
        const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
            width: 512,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        })

        // Update menu with QR code URL
        const { error: updateError } = await supabase
            .from('menus')
            .update({ qr_code_url: qrCodeDataUrl })
            .eq('id', id)

        if (updateError) {
            console.error('Error updating menu with QR code:', updateError)
        }

        return NextResponse.json({ qrCodeUrl: qrCodeDataUrl, menuUrl })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
