'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import MenuEditor from '@/components/MenuEditor'
import { MenuData } from '@/lib/types'

export default function EditorPage() {
    const params = useParams()
    const router = useRouter()
    const menuId = params.id as string

    const [menu, setMenu] = useState<MenuData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadMenu()
    }, [menuId])

    const loadMenu = async () => {
        try {
            const response = await fetch(`/api/menus/${menuId}`)
            if (!response.ok) {
                throw new Error('Menu not found')
            }
            const data = await response.json()
            setMenu(data.menu)
        } catch (err: any) {
            setError(err.message || 'Failed to load menu')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (updatedMenu: Partial<MenuData>) => {
        try {
            const response = await fetch(`/api/menus/${menuId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedMenu),
            })
            if (!response.ok) {
                throw new Error('Failed to save menu')
            }
            return true
        } catch (err) {
            console.error('Save error:', err)
            return false
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading menu editor...</p>
                </div>
            </div>
        )
    }

    if (error || !menu) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return <MenuEditor menuId={menuId} initialMenu={menu} onSave={handleSave} />
}
