'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, QrCode, LogOut, Loader2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Menu {
    id: string
    title: string
    slug: string
    is_public: boolean
    updated_at: string
    created_at: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [menus, setMenus] = useState<Menu[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadUser()
        loadMenus()
    }, [])

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }

    const loadMenus = async () => {
        try {
            const response = await fetch('/api/menus')
            const data = await response.json()
            setMenus(data.menus || [])
        } catch (error) {
            console.error('Error loading menus:', error)
        } finally {
            setLoading(false)
        }
    }

    const createNewMenu = async () => {
        setCreating(true)
        try {
            const response = await fetch('/api/menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Untitled Menu' }),
            })
            const data = await response.json()
            if (data.menu) {
                router.push(`/editor/${data.menu.id}`)
            }
        } catch (error) {
            console.error('Error creating menu:', error)
            setCreating(false)
        }
    }

    const deleteMenu = async (id: string) => {
        if (!confirm('Are you sure you want to delete this menu?')) return

        try {
            await fetch(`/api/menus/${id}`, { method: 'DELETE' })
            setMenus(menus.filter(m => m.id !== id))
        } catch (error) {
            console.error('Error deleting menu:', error)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                            <span className="text-xl font-bold">Menu Editor</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user?.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Menus</h1>
                        <p className="text-gray-600">Create and manage your restaurant menus</p>
                    </div>
                    <button
                        onClick={createNewMenu}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Create New Menu
                            </>
                        )}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && menus.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <Plus className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No menus yet</h2>
                        <p className="text-gray-600 mb-6">Create your first menu to get started</p>
                        <button
                            onClick={createNewMenu}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Menu
                        </button>
                    </div>
                )}

                {/* Menus Grid */}
                {!loading && menus.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menus.map((menu) => (
                            <div
                                key={menu.id}
                                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Preview */}
                                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white rounded-lg shadow-md mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-2xl">📋</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Menu Preview</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{menu.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Updated {formatDate(menu.updated_at)}
                                    </p>

                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        {menu.is_public ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                <Eye className="w-3 h-3" />
                                                Public
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                                Private
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/editor/${menu.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <Link
                                            href={`/menu/${menu.slug}`}
                                            target="_blank"
                                            className="flex items-center justify-center px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => deleteMenu(menu.id)}
                                            className="flex items-center justify-center px-4 py-2 border-2 border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
