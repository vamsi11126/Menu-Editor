export interface MenuItem {
    id: number
    name: string
    price?: string
    price1?: string
    price2?: string
    label1?: string
    label2?: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily: string
    type: 'item' | 'title'
    layout: string
    align: 'left' | 'center' | 'right'
    priceType?: 'single' | 'double'
    showUnderline?: boolean
}

export interface SectionItem {
    name: string
    price?: string
    price1?: string
    price2?: string
    isDouble?: boolean
}

export interface Section {
    id: number
    title: string
    x: number
    y: number
    fontSize: number
    titleFontSize: number
    color: string
    fontFamily: string
    titleFontFamily: string
    align: 'left' | 'center' | 'right'
    borderColor: string
    lineSpacing: number
    letterSpacing: number
    columnWidth: number
    showUnderline: boolean
    showColumnHeaders: boolean
    header1Text: string
    header2Text: string
    headerFontSize: number
    headerFontFamily: string
    headerColor: string
    headerBold: boolean
    showBorder: boolean
    borderThickness: number
    borderPadding: number
    backgroundColor: string
    width: number
    height: number
    useAutoHeight?: boolean
    columnGap?: number
    items: SectionItem[]
}

export interface Line {
    id: number
    x1: number
    y1: number
    x2: number
    y2: number
    color: string
    thickness: number
}

export interface ImageAdjustments {
    brightness: number
    contrast: number
    exposure: number
    saturation: number
    temperature: number
    sharpness: number
    clarity: number
    blur: number
    opacity: number
}

export interface MenuImage {
    id: number
    src: string
    x: number
    y: number
    width: number
    height: number
    align: 'left' | 'center' | 'right'
    adjustments: ImageAdjustments
}

export interface CanvasSize {
    width: number
    height: number
}

export interface UniformSectionSize {
    width: number
    height: number
}

export interface MenuData {
    id?: string
    userId?: string
    title: string
    slug: string
    isPublic: boolean
    qrCodeUrl?: string
    canvasSize: CanvasSize
    backgroundUrl: string
    backgroundColor: string
    sections: Section[]
    individualItems: MenuItem[]
    lines: Line[]
    images: MenuImage[]
    itemSpacing: number
    uniformSectionSize: UniformSectionSize
    priceMemory: Record<string, string>
    createdAt?: string
    updatedAt?: string
}

export interface User {
    id: string
    email: string
    name?: string
    image?: string
}
