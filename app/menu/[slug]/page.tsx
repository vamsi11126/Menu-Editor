import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MenuData } from '@/lib/types'

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch menu by slug (public access)
    const { data: menu, error } = await supabase
        .from('menus')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .single()

    if (error || !menu) {
        notFound()
    }

    const menuData: MenuData = menu as any
    const isDualPriceType = (priceType?: MenuData['individualItems'][number]['priceType']) =>
        priceType === 'double' || priceType === 'small-large' || priceType === 'half-full'
    const getPriceLabels = (priceType?: MenuData['individualItems'][number]['priceType']) => {
        if (priceType === 'small-large') return { label1: 'Small', label2: 'Large' }
        if (priceType === 'half-full') return { label1: 'Half', label2: 'Full' }
        return { label1: 'Single', label2: 'Double' }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-center">{menuData.title}</h1>
                </div>
            </header>

            {/* Menu Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    style={{
                        width: '100%',
                        maxWidth: `${menuData.canvasSize.width}px`,
                        margin: '0 auto',
                    }}
                >
                    <div
                        className="relative"
                        style={{
                            width: menuData.canvasSize.width,
                            height: menuData.canvasSize.height,
                            backgroundImage: `url(${menuData.backgroundUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: menuData.backgroundColor,
                        }}
                    >
                        {/* Render Images */}
                        {menuData.images?.map((image) => (
                            <img
                                key={image.id}
                                src={image.src}
                                alt="Menu image"
                                style={{
                                    position: 'absolute',
                                    left: `${image.x}px`,
                                    top: `${image.y}px`,
                                    width: `${image.width}px`,
                                    height: `${image.height}px`,
                                    objectFit: 'cover',
                                }}
                            />
                        ))}

                        {/* Render Lines */}
                        {menuData.lines?.map((line) => (
                            <svg
                                key={line.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                }}
                            >
                                <line
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke={line.color}
                                    strokeWidth={line.thickness}
                                />
                            </svg>
                        ))}

                        {/* Render Sections */}
                        {menuData.sections?.map((section) => {
                            const padding = section.borderPadding || 16
                            const lineHeight = section.fontSize * (section.lineSpacing || 1.5)
                            const titleHeight = section.titleFontSize + 30
                            const itemsHeight = section.items.length * lineHeight + 10
                            const autoHeight = titleHeight + itemsHeight + padding * 2
                            const sectionHeight = section.useAutoHeight !== false ? autoHeight : section.height

                            return (
                                <div
                                    key={section.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${section.x}px`,
                                        top: `${section.y}px`,
                                        width: `${section.width}px`,
                                        height: `${sectionHeight}px`,
                                        padding: `${padding}px`,
                                        border: section.showBorder !== false ? `${section.borderThickness || 1}px solid ${section.borderColor}` : 'none',
                                        backgroundColor: section.backgroundColor || menuData.backgroundColor,
                                        borderRadius: '8px',
                                    }}
                                >
                                    {/* Title */}
                                    <div
                                        style={{
                                            fontSize: `${section.titleFontSize}px`,
                                            fontFamily: section.titleFontFamily || 'Georgia',
                                            fontWeight: 'bold',
                                            color: section.color,
                                            textTransform: 'uppercase',
                                            marginBottom: '12px',
                                            textAlign: section.align || 'left',
                                            borderBottom: section.showUnderline !== false ? `2px solid ${section.borderColor}` : 'none',
                                            paddingBottom: '8px',
                                        }}
                                    >
                                        {section.title}
                                    </div>

                                    {/* Column Headers */}
                                    {section.showColumnHeaders !== false && section.items.some(item => item.isDouble) && (
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: `1fr ${(section.columnWidth || 70) * 2 + (section.columnGap || 8)}px`,
                                                gap: `${section.columnGap || 8}px`,
                                                marginBottom: '12px',
                                                paddingBottom: '6px',
                                            }}
                                        >
                                            <div></div>
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: `${section.columnGap || 8}px`,
                                                    fontSize: `${section.headerFontSize || 14}px`,
                                                    fontFamily: section.headerFontFamily || 'Arial',
                                                    color: section.headerColor || section.color,
                                                    fontWeight: section.headerBold !== false ? 'bold' : 'normal',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                <div style={{ textAlign: 'center' }}>{section.header1Text || 'Single'}</div>
                                                <div style={{ textAlign: 'center' }}>{section.header2Text || 'Double'}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: `auto 1fr ${(section.columnWidth || 70) * 2 + (section.columnGap || 8)}px`,
                                            gap: `${section.columnGap || 8}px`,
                                            rowGap: `${(section.lineSpacing || 1.5) * 8}px`,
                                        }}
                                    >
                                        {section.items.map((item, index) => (
                                            <>
                                                <div
                                                    key={`num-${index}`}
                                                    style={{
                                                        fontSize: `${section.fontSize}px`,
                                                        fontFamily: section.fontFamily || 'Arial',
                                                        color: section.color,
                                                        fontWeight: '500',
                                                        paddingRight: '8px',
                                                    }}
                                                >
                                                    {index + 1}.
                                                </div>
                                                <div
                                                    key={`name-${index}`}
                                                    style={{
                                                        fontSize: `${section.fontSize}px`,
                                                        fontFamily: section.fontFamily || 'Arial',
                                                        color: section.color,
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    {item.name}
                                                </div>
                                                {item.isDouble ? (
                                                    <div
                                                        key={`price-${index}`}
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: `${section.columnGap || 8}px`,
                                                            fontSize: `${section.fontSize}px`,
                                                            fontFamily: section.fontFamily || 'Arial',
                                                            color: section.color,
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        <div style={{ textAlign: 'center' }}>₹{item.price1 || '0'}</div>
                                                        <div style={{ textAlign: 'center' }}>₹{item.price2 || '0'}</div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={`price-${index}`}
                                                        style={{
                                                            fontSize: `${section.fontSize}px`,
                                                            fontFamily: section.fontFamily || 'Arial',
                                                            color: section.color,
                                                            fontWeight: 'bold',
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        ₹{item.price || '0'}
                                                    </div>
                                                )}
                                            </>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Render Individual Items */}
                        {menuData.individualItems?.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    left: `${item.x}px`,
                                    top: `${item.y}px`,
                                    padding: '8px 12px',
                                    minWidth: isDualPriceType(item.priceType) ? '450px' : '300px',
                                }}
                            >
                                {item.type === 'title' ? (
                                    <div
                                        style={{
                                            fontSize: `${item.fontSize}px`,
                                            color: item.color,
                                            fontWeight: 'bold',
                                            fontFamily: item.fontFamily || 'Arial',
                                            textTransform: 'uppercase',
                                            borderBottom: item.showUnderline !== false ? '2px solid currentColor' : 'none',
                                            paddingBottom: item.showUnderline !== false ? '4px' : '0',
                                            textAlign: item.align || 'left',
                                        }}
                                    >
                                        {item.name}
                                    </div>
                                ) : isDualPriceType(item.priceType) ? (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto auto',
                                            gap: '15px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: `${item.fontSize}px`,
                                                color: item.color,
                                                fontWeight: '500',
                                                fontFamily: item.fontFamily || 'Arial',
                                            }}
                                        >
                                            {item.name}
                                        </span>
                                        <div style={{ textAlign: 'center', minWidth: '90px' }}>
                                            <div
                                                style={{
                                                    fontSize: `${Math.max(10, item.fontSize - 4)}px`,
                                                    color: item.color,
                                                    fontWeight: 'bold',
                                                    marginBottom: '4px',
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {item.label1 || getPriceLabels(item.priceType).label1}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: `${item.fontSize}px`,
                                                    color: item.color,
                                                    fontWeight: 'bold',
                                                    fontFamily: item.fontFamily || 'Arial',
                                                }}
                                            >
                                                ₹{item.price1 || '0'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', minWidth: '90px' }}>
                                            <div
                                                style={{
                                                    fontSize: `${Math.max(10, item.fontSize - 4)}px`,
                                                    color: item.color,
                                                    fontWeight: 'bold',
                                                    marginBottom: '4px',
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {item.label2 || getPriceLabels(item.priceType).label2}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: `${item.fontSize}px`,
                                                    color: item.color,
                                                    fontWeight: 'bold',
                                                    fontFamily: item.fontFamily || 'Arial',
                                                }}
                                            >
                                                ₹{item.price2 || '0'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 80px',
                                            gap: '10px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: `${item.fontSize}px`,
                                                color: item.color,
                                                fontWeight: '500',
                                                fontFamily: item.fontFamily || 'Arial',
                                            }}
                                        >
                                            {item.name}
                                        </span>
                                        {item.price && (
                                            <span
                                                style={{
                                                    fontSize: `${item.fontSize}px`,
                                                    color: item.color,
                                                    fontWeight: 'bold',
                                                    fontFamily: item.fontFamily || 'Arial',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                ₹{item.price}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>Created with Menu Editor</p>
                </div>
            </main>
        </div>
    )
}
