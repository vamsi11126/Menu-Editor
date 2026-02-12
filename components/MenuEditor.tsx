/*
 * MenuEditor Component - Main Menu Editor
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, Eye, Download, Upload, Minus, Share2, QrCode as QrCodeIcon } from 'lucide-react';
import { MenuData, MenuItem, Section } from '@/lib/types';

interface MenuEditorProps {
    menuId: string;
    initialMenu: MenuData;
    onSave: (menu: Partial<MenuData>) => Promise<boolean>;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ menuId, initialMenu, onSave }) => {
    // Initialize state from initialMenu prop
    const [menuItems, setMenuItems] = useState(initialMenu.individualItems || []);
    const [sections, setSections] = useState(initialMenu.sections || []);
    const [lines, setLines] = useState(initialMenu.lines || []);
    const [images, setImages] = useState(initialMenu.images || []);
    const [itemSpacing, setItemSpacing] = useState(initialMenu.itemSpacing || 50);
    const [canvasSize, setCanvasSize] = useState(initialMenu.canvasSize || { width: 600, height: 800 });
    const [backgroundUrl, setBackgroundUrl] = useState(initialMenu.backgroundUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect fill='%23f8f9fa' width='600' height='800'/%3E%3Ctext x='300' y='80' font-family='Arial' font-size='32' fill='%23333' text-anchor='middle' font-weight='bold'%3ERestaurant Menu%3C/text%3E%3Crect x='50' y='120' width='500' height='2' fill='%23ddd'/%3E%3C/svg%3E");
    const [backgroundColor, setBackgroundColor] = useState(initialMenu.backgroundColor || '#f8f9fa');
    const [uniformSectionSize, setUniformSectionSize] = useState(initialMenu.uniformSectionSize || { width: 400, height: 300 });
    const [priceMemory, setPriceMemory] = useState(initialMenu.priceMemory || {});

    // Other state variables
    const [mode, setMode] = useState('admin');
    const [bulkAddText, setBulkAddText] = useState('');
    const [showColumnHeaders, setShowColumnHeaders] = useState(true);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedSections, setSelectedSections] = useState<number[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [dragging, setDragging] = useState<string | false>(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showInstructions, setShowInstructions] = useState(false);
    const [drawingLine, setDrawingLine] = useState(false);
    const [currentLine, setCurrentLine] = useState<any>(null);
    const [lineStartPoint, setLineStartPoint] = useState<any>(null);
    const [selectedSectionItem, setSelectedSectionItem] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const defaultImageAdjustments = {
        brightness: 100,
        contrast: 100,
        exposure: 100,
        saturation: 100,
        temperature: 0,
        sharpness: 0,
        clarity: 0,
        blur: 0,
        opacity: 100
    };

    // Cloud-saving version of autoSave
    const autoSave = async () => {
        const menuData = {
            title: initialMenu.title,
            sections,
            individual_items: menuItems,
            item_spacing: itemSpacing,
            canvas_size: canvasSize,
            background_url: backgroundUrl,
            background_color: backgroundColor,
            lines,
            images,
            uniform_section_size: uniformSectionSize,
            price_memory: priceMemory,
        };

        const success = await onSave(menuData);
        if (success) {
            console.log('✅ Auto-saved to cloud at:', new Date().toLocaleTimeString());
            setHasUnsavedChanges(false);
        }
    };

    // Save state to history for undo/redo
    const saveToHistory = () => {
        const currentState = {
            menuItems: JSON.parse(JSON.stringify(menuItems)),
            sections: JSON.parse(JSON.stringify(sections)),
            lines: JSON.parse(JSON.stringify(lines)),
            images: JSON.parse(JSON.stringify(images)),
            itemSpacing,
            uniformSectionSize: { ...uniformSectionSize }
        };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);

        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setHistoryIndex(historyIndex + 1);
        }

        setHistory(newHistory);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const state = history[newIndex];
            setMenuItems(state.menuItems);
            setSections(state.sections);
            setLines(state.lines);
            setImages(state.images);
            setItemSpacing(state.itemSpacing);
            setUniformSectionSize(state.uniformSectionSize);
            setHistoryIndex(newIndex);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const state = history[newIndex];
            setMenuItems(state.menuItems);
            setSections(state.sections);
            setLines(state.lines);
            setImages(state.images);
            setItemSpacing(state.itemSpacing);
            setUniformSectionSize(state.uniformSectionSize);
            setHistoryIndex(newIndex);
        }
    };

    // Auto-save functionality
    useEffect(() => {
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setInterval(autoSave, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [menuItems, sections, lines, images, itemSpacing, canvasSize, backgroundUrl, backgroundColor, priceMemory, uniformSectionSize]);

    useEffect(() => {
        const timer = setTimeout(() => {
            autoSave();
        }, 2000);

        return () => clearTimeout(timer);
    }, [menuItems, sections, lines, images, itemSpacing, uniformSectionSize]);

    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [menuItems, sections, lines]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Do you want to save a draft before leaving?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleMouseDown = (e: React.MouseEvent, item: any) => {
        if (mode !== 'admin' || drawingLine) return;
        e.stopPropagation();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const isSection = sections.find(s => s.id === item.id);
        const isLine = lines.find(l => l.id === item.id);
        const isImage = images.find(img => img.id === item.id);

        setDragOffset({
            x: e.clientX - rect.left - item.x,
            y: e.clientY - rect.top - item.y
        });
        setSelectedItem(item.id);
        setDragging(isSection ? 'section' : isLine ? 'line' : isImage ? 'image' : 'item');
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'admin' || !drawingLine) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setLineStartPoint({ x, y });
        setCurrentLine({
            id: Date.now(),
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            color: '#000000',
            thickness: 2
        });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!drawingLine || !lineStartPoint || !currentLine) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentLine({
            ...currentLine,
            x2: x,
            y2: y
        });
    };

    const handleCanvasMouseUp = () => {
        if (drawingLine && currentLine) {
            setLines([...lines, currentLine]);
            setCurrentLine(null);
            setLineStartPoint(null);
            setDrawingLine(false);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging || !selectedItem || mode !== 'admin') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, canvasSize.width - 200));
        const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, canvasSize.height - 50));

        if (dragging === 'section') {
            setSections(sections.map(section =>
                section.id === selectedItem ? { ...section, x: newX, y: newY } : section
            ));
        } else if (dragging === 'line') {
            const line = lines.find(l => l.id === selectedItem);
            if (line) {
                const width = line.x2 - line.x1;
                const height = line.y2 - line.y1;
                setLines(lines.map(l =>
                    l.id === selectedItem ? { ...l, x1: newX, y1: newY, x2: newX + width, y2: newY + height } : l
                ));
            }
        } else if (dragging === 'image') {
            setImages(images.map(img =>
                img.id === selectedItem ? { ...img, x: newX, y: newY } : img
            ));
        } else {
            setMenuItems(items =>
                items.map(item =>
                    item.id === selectedItem ? { ...item, x: newX, y: newY } : item
                )
            );
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragging, selectedItem, dragOffset]);

    const getNextYPosition = () => {
        if (menuItems.length === 0) return 150;
        const itemsOnly = menuItems.filter(item => item.type === 'item' || item.type === 'title');
        if (itemsOnly.length === 0) return 150;
        const lastItem = itemsOnly[itemsOnly.length - 1];
        return lastItem.y + itemSpacing;
    };

    const addNewItem = () => {
        const lastItem = menuItems.filter(item => item.type === 'item').slice(-1)[0];
        const newItem: MenuItem = {
            id: Date.now(),
            name: 'New Item',
            price: '0',
            x: 100,
            y: getNextYPosition(),
            fontSize: 16,
            color: lastItem ? lastItem.color : '#000000',
            fontFamily: 'Arial',
            type: 'item',
            layout: 'line',
            align: 'left',
            priceType: 'single'
        };
        setMenuItems([...menuItems, newItem]);
    };

    const addNewTitle = () => {
        const lastTitle = menuItems.filter(item => item.type === 'title').slice(-1)[0];
        const newTitle: MenuItem = {
            id: Date.now(),
            name: 'STARTERS',
            price: '',
            x: 100,
            y: getNextYPosition(),
            fontSize: 24,
            color: lastTitle ? lastTitle.color : '#000000',
            fontFamily: 'Georgia',
            type: 'title',
            layout: 'line',
            align: 'left',
            showUnderline: true
        };
        setMenuItems([...menuItems, newTitle]);
    };

    const addNewSection = () => {
        saveToHistory();
        const lastSection = sections.slice(-1)[0];
        const newSection: Section = {
            id: Date.now(),
            title: 'NEW SECTION',
            x: 100,
            y: getNextYPosition(),
            fontSize: 18,
            titleFontSize: 24,
            color: lastSection ? lastSection.color : '#000000',
            fontFamily: 'Arial',
            titleFontFamily: 'Georgia',
            align: 'left',
            borderColor: '#dee2e6',
            lineSpacing: 1.5,
            letterSpacing: 0,
            columnWidth: 70,
            showUnderline: true,
            showColumnHeaders: true,
            header1Text: 'Single',
            header2Text: 'Double',
            headerFontSize: 14,
            headerFontFamily: 'Arial',
            headerColor: '#000000',
            headerBold: true,
            showBorder: true,
            borderThickness: 1,
            borderPadding: 16,
            backgroundColor: backgroundColor,
            width: uniformSectionSize.width,
            height: uniformSectionSize.height,
            items: []
        };
        setSections([...sections, newSection]);
        setSelectedItem(newSection.id);
    };

    const addBulkItems = () => {
        if (!bulkAddText.trim()) {
            alert('Please enter items in the format:\nItem Name - Price\nOR\nItem Name - Price1 - Price2 (for double pricing)');
            return;
        }

        saveToHistory();
        const lines = bulkAddText.trim().split('\n').filter(line => line.trim());
        const lastItem = menuItems.filter(item => item.type === 'item').slice(-1)[0];
        const defaultColor = lastItem ? lastItem.color : '#000000';
        let currentY = getNextYPosition();

        const newItems = lines.map((line, index) => {
            let cleanLine = line.replace(/^\d+[\.)]\s*/, '').trim();
            cleanLine = cleanLine.replace(/[–—−]/g, '-');
            const parts = cleanLine.split('-').map(s => s.trim()).filter(s => s);

            if (parts.length < 2) return null;

            const name = parts[0] || 'New Item';

            if (parts.length === 3) {
                let price1 = parts[1].replace(/[^\d]/g, '');
                let price2 = parts[2].replace(/[^\d]/g, '');

                if (!price1 || !price2) return null;

                const item: MenuItem = {
                    id: Date.now() + index,
                    name,
                    price1,
                    price2,
                    label1: 'Single',
                    label2: 'Double',
                    x: 100,
                    y: currentY,
                    fontSize: 16,
                    color: defaultColor,
                    fontFamily: 'Arial',
                    type: 'item',
                    layout: 'line',
                    align: 'left',
                    priceType: 'double'
                };

                currentY += itemSpacing;
                return item;
            } else {
                let price = parts[1].replace(/[^\d]/g, '');

                if (!price) return null;

                if (priceMemory[name.toLowerCase()]) {
                    price = priceMemory[name.toLowerCase()];
                } else {
                    setPriceMemory(prev => ({
                        ...prev,
                        [name.toLowerCase()]: price
                    }));
                }

                const item: MenuItem = {
                    id: Date.now() + index,
                    name,
                    price,
                    x: 100,
                    y: currentY,
                    fontSize: 16,
                    color: defaultColor,
                    fontFamily: 'Arial',
                    type: 'item',
                    layout: 'line',
                    align: 'left',
                    priceType: 'single'
                };

                currentY += itemSpacing;
                return item;
            }
        }).filter(item => item !== null);

        setMenuItems([...menuItems, ...newItems]);
        setBulkAddText('');
        alert(`${newItems.length} item(s) added successfully!`);
    };

    const addItemsToSection = (sectionId: number) => {
        if (!bulkAddText.trim()) {
            alert('Please enter items in the format:\nSingle: Item Name - Price\nDouble: Item Name - Price1 - Price2');
            return;
        }

        saveToHistory();
        const lines = bulkAddText.trim().split('\n').filter(line => line.trim());

        const newItems = lines.map((line) => {
            let cleanLine = line.replace(/^\d+[\.)]\s*/, '').trim();
            cleanLine = cleanLine.replace(/[–—−]/g, '-');
            const parts = cleanLine.split('-').map(s => s.trim()).filter(s => s);

            if (parts.length < 2) return null;

            const name = parts[0] || 'New Item';

            if (parts.length === 3) {
                const price1 = parts[1].replace(/[^\d]/g, '');
                const price2 = parts[2].replace(/[^\d]/g, '');

                if (!price1 || !price2) return null;

                return { name, price1, price2, isDouble: true };
            } else {
                let price = parts[1].replace(/[^\d]/g, '');

                if (!price) return null;

                if (priceMemory[name.toLowerCase()]) {
                    price = priceMemory[name.toLowerCase()];
                } else {
                    setPriceMemory(prev => ({
                        ...prev,
                        [name.toLowerCase()]: price
                    }));
                }

                return { name, price };
            }
        }).filter(item => item !== null);

        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, items: [...s.items, ...newItems], backgroundColor: backgroundColor }
                : s
        ));

        setBulkAddText('');
        alert(`${newItems.length} item(s) added to section!`);
    };

    const updateSection = (id: number, field: string, value: any) => {
        saveToHistory();
        setSections(sections.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const deleteSection = (id: number) => {
        saveToHistory();
        setSections(sections.filter(s => s.id !== id));
        setSelectedItem(null);
    };

    const updateSectionItem = (sectionId: number, itemIndex: number, field: string, value: any) => {
        saveToHistory();
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                const updatedItems = [...s.items];
                updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
                return { ...s, items: updatedItems };
            }
            return s;
        }));
    };

    const deleteItemFromSection = (sectionId: number, itemIndex: number) => {
        saveToHistory();
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.filter((_, i) => i !== itemIndex) }
                : s
        ));
        setSelectedSectionItem(null);
    };

    const deleteItem = (id: number) => {
        saveToHistory();
        setMenuItems(menuItems.filter(item => item.id !== id));
        setSelectedItem(null);
    };

    const deleteLine = (id: number) => {
        saveToHistory();
        setLines(lines.filter(line => line.id !== id));
        setSelectedItem(null);
    };

    const deleteImage = (id: number) => {
        saveToHistory();
        setImages(images.filter(img => img.id !== id));
        setSelectedItem(null);
    };

    const updateItem = (id: number, field: string, value: any) => {
        saveToHistory();
        setMenuItems(items =>
            items.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };

                    if (field === 'price' && item.name) {
                        setPriceMemory(prev => ({
                            ...prev,
                            [item.name.toLowerCase()]: value
                        }));
                    }

                    if (field === 'name' && priceMemory[value.toLowerCase()]) {
                        updatedItem.price = priceMemory[value.toLowerCase()];
                    }

                    return updatedItem;
                }
                return item;
            })
        );
    };

    const updateLine = (id: number, field: string, value: any) => {
        saveToHistory();
        setLines(lines.map(line =>
            line.id === id ? { ...line, [field]: value } : line
        ));
    };

    const updateImage = (id: number, field: string, value: any) => {
        saveToHistory();
        setImages(images.map(img =>
            img.id === id ? { ...img, [field]: value } : img
        ));
    };

    // Cloud upload version of addImage
    const addImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file');
            return;
        }

        saveToHistory();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.url) {
                const newImage = {
                    id: Date.now(),
                    src: data.url,
                    x: 100,
                    y: 100,
                    width: 150,
                    height: 150,
                    align: 'left' as const,
                    adjustments: { ...defaultImageAdjustments }
                };
                setImages([...images, newImage]);
                setSelectedItem(newImage.id);
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        }
    };

    const updateImageAdjustment = (id: number, adjustment: string, value: number) => {
        saveToHistory();
        setImages(images.map(img =>
            img.id === id
                ? {
                    ...img,
                    adjustments: {
                        ...(img.adjustments || defaultImageAdjustments),
                        [adjustment]: value
                    }
                }
                : img
        ));
    };

    const getImageFilterStyle = (adjustments: any) => {
        if (!adjustments) return {};

        const filters = [];

        if (adjustments.brightness !== 100) {
            filters.push(`brightness(${adjustments.brightness}%)`);
        }

        if (adjustments.contrast !== 100) {
            filters.push(`contrast(${adjustments.contrast}%)`);
        }

        if (adjustments.saturation !== 100) {
            filters.push(`saturate(${adjustments.saturation}%)`);
        }

        if (adjustments.temperature !== 0) {
            filters.push(`hue-rotate(${adjustments.temperature * 0.5}deg)`);
        }

        if (adjustments.sharpness > 0) {
            const sharpnessBoost = 100 + (adjustments.sharpness * 0.5);
            filters.push(`contrast(${sharpnessBoost}%)`);
        }

        if (adjustments.clarity > 0) {
            const clarityBoost = 100 + (adjustments.clarity * 0.3);
            filters.push(`saturate(${clarityBoost}%)`);
        }

        if (adjustments.blur > 0) {
            filters.push(`blur(${adjustments.blur / 10}px)`);
        }

        if (adjustments.exposure !== 100) {
            filters.push(`brightness(${adjustments.exposure}%)`);
        }

        return {
            filter: filters.length > 0 ? filters.join(' ') : 'none',
            opacity: (adjustments.opacity || 100) / 100
        };
    };

    const saveMenu = async () => {
        await autoSave();
        alert('Menu saved successfully to cloud!');
    };

    const toggleItemSelection = (itemId: number) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const toggleSectionSelection = (sectionId: number) => {
        if (selectedSections.includes(sectionId)) {
            setSelectedSections(selectedSections.filter(id => id !== sectionId));
        } else {
            setSelectedSections([...selectedSections, sectionId]);
        }
    };

    const updateMultipleSections = (field: string, value: any) => {
        saveToHistory();
        setSections(sections.map(section =>
            selectedSections.includes(section.id) ? { ...section, [field]: value } : section
        ));
    };

    const deleteMultipleSections = () => {
        if (confirm(`Delete ${selectedSections.length} selected table(s)?`)) {
            saveToHistory();
            setSections(sections.filter(section => !selectedSections.includes(section.id)));
            setSelectedSections([]);
            setSelectedItem(null);
        }
    };

    const updateMultipleItems = (field: string, value: any) => {
        setMenuItems(items =>
            items.map(item =>
                selectedItems.includes(item.id) ? { ...item, [field]: value } : item
            )
        );
    };

    const deleteMultipleItems = () => {
        if (confirm(`Delete ${selectedItems.length} selected items?`)) {
            setMenuItems(menuItems.filter(item => !selectedItems.includes(item.id)));
            setSelectedItems([]);
            setSelectedItem(null);
        }
    };

    const availableFonts = [
        'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana',
        'Helvetica', 'Comic Sans MS', 'Impact', 'Palatino', 'Garamond',
        'Bookman', 'Trebuchet MS', 'Playfair Display', 'Merriweather',
        'Lora', 'Crimson Text', 'EB Garamond', 'Libre Baskerville',
        'Cormorant Garamond', 'Cinzel', 'Oswald', 'Bebas Neue',
        'Alfa Slab One', 'Anton', 'Righteous'
    ];

    const downloadAsImage = async () => {
        try {
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 1000));

            let maxContentHeight = canvasSize.height;

            sections.forEach(section => {
                const padding = section.borderPadding || 16;
                const titleHeight = section.titleFontSize + 30;
                const lineHeight = section.fontSize * (section.lineSpacing || 1.5);
                const itemsHeight = section.items.length * lineHeight;
                const fullSectionHeight = titleHeight + itemsHeight + (padding * 2) + 30;
                maxContentHeight = Math.max(maxContentHeight, section.y + fullSectionHeight);
            });

            menuItems.forEach(item => {
                maxContentHeight = Math.max(maxContentHeight, item.y + item.fontSize * 3);
            });

            lines.forEach(line => {
                maxContentHeight = Math.max(maxContentHeight, Math.max(line.y1, line.y2) + 30);
            });

            images.forEach(img => {
                maxContentHeight = Math.max(maxContentHeight, img.y + img.height + 30);
            });

            maxContentHeight += 100;

            const exportWidth = Math.max(canvasSize.width, 827);
            const exportHeight = Math.max(maxContentHeight, 1169);
            const scaleFactor = 4;
            const finalWidth = Math.max(exportWidth * scaleFactor, 3300);
            const finalHeight = exportHeight * scaleFactor;

            const canvas = document.createElement('canvas');
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const scaleX = finalWidth / exportWidth;
            const scaleY = finalHeight / exportHeight;
            ctx.scale(scaleX, scaleY);

            if (backgroundUrl.startsWith('data:image/svg+xml')) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, exportWidth, exportHeight);
                ctx.fillStyle = '#333';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('Restaurant Menu', exportWidth / 2, 80);
                ctx.fillStyle = '#ddd';
                ctx.fillRect(50, 120, exportWidth - 100, 2);
            } else {
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                await new Promise((resolve) => {
                    bgImg.onload = resolve;
                    bgImg.onerror = () => {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, exportWidth, exportHeight);
                        resolve(null);
                    };
                    bgImg.src = backgroundUrl;
                    setTimeout(resolve, 3000);
                });
                if (bgImg.complete && bgImg.naturalWidth > 0) {
                    ctx.drawImage(bgImg, 0, 0, exportWidth, exportHeight);
                }
            } for (const image of images) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    img.src = image.src;
                    setTimeout(resolve, 2000);
                });
                if (img.complete && img.naturalWidth > 0) {
                    ctx.save();

                    const adj = image.adjustments || defaultImageAdjustments;
                    ctx.globalAlpha = (adj.opacity || 100) / 100;

                    const filters = [];
                    if (adj.brightness !== 100) filters.push(`brightness(${adj.brightness}%)`);
                    if (adj.contrast !== 100) filters.push(`contrast(${adj.contrast}%)`);
                    if (adj.saturation !== 100) filters.push(`saturate(${adj.saturation}%)`);
                    if (adj.temperature !== 0) filters.push(`hue-rotate(${adj.temperature * 0.5}deg)`);
                    if (adj.sharpness > 0) filters.push(`contrast(${100 + (adj.sharpness * 0.5)}%)`);
                    if (adj.clarity > 0) filters.push(`saturate(${100 + (adj.clarity * 0.3)}%)`);
                    if (adj.blur > 0) filters.push(`blur(${adj.blur / 10}px)`);
                    if (adj.exposure !== 100) filters.push(`brightness(${adj.exposure}%)`);

                    if (filters.length > 0) {
                        ctx.filter = filters.join(' ');
                    }

                    ctx.drawImage(img, image.x, image.y, image.width, image.height);

                    ctx.filter = 'none';
                    ctx.globalAlpha = 1;
                    ctx.restore();
                }
            }

            lines.forEach(line => {
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.thickness;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.stroke();
            });

            sections.forEach(section => {
                ctx.save();

                const sectionWidth = section.width || uniformSectionSize.width;
                const padding = section.borderPadding || 16;
                const lineHeight = section.fontSize * (section.lineSpacing || 1.5);
                const columnGap = section.columnGap || 8;

                const titleHeight = section.titleFontSize + 35;
                const headerHeight = (section.showColumnHeaders !== false && section.items.some((item: any) => item.isDouble)) ? (section.headerFontSize || 14) + 20 : 0;
                const itemsHeight = section.items.length * lineHeight + 10;
                const actualHeight = titleHeight + headerHeight + itemsHeight + (padding * 2) + 20;

                ctx.fillStyle = section.backgroundColor || backgroundColor;
                ctx.fillRect(section.x, section.y, sectionWidth, actualHeight);

                if (section.showBorder !== false) {
                    ctx.strokeStyle = section.borderColor;
                    ctx.lineWidth = section.borderThickness || 1;
                    ctx.strokeRect(section.x, section.y, sectionWidth, actualHeight);
                }

                ctx.fillStyle = section.color;
                ctx.font = `bold ${section.titleFontSize}px "${section.titleFontFamily || 'Georgia'}"`;
                ctx.textAlign = section.align || 'left';
                ctx.textBaseline = 'top';

                const titleX = section.align === 'center' ? section.x + sectionWidth / 2 :
                    section.align === 'right' ? section.x + sectionWidth - padding :
                        section.x + padding;
                ctx.fillText(section.title, titleX, section.y + padding);

                if (section.showUnderline !== false) {
                    ctx.strokeStyle = section.borderColor;
                    ctx.lineWidth = 2;
                    const underlineY = section.y + padding + section.titleFontSize + 10;
                    ctx.beginPath();
                    ctx.moveTo(section.x + padding, underlineY);
                    ctx.lineTo(section.x + sectionWidth - padding, underlineY);
                    ctx.stroke();
                }

                let currentY = section.y + padding + titleHeight;
                if (section.showColumnHeaders !== false && section.items.some((item: any) => item.isDouble)) {
                    ctx.fillStyle = section.headerColor || section.color;
                    ctx.font = `${section.headerBold !== false ? 'bold' : 'normal'} ${section.headerFontSize || 14}px "${section.headerFontFamily || 'Arial'}"`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';

                    const columnWidth = section.columnWidth || 70;
                    const header1X = section.x + sectionWidth - padding - columnWidth * 2 - columnGap + columnWidth / 2;
                    const header2X = section.x + sectionWidth - padding - columnWidth + columnWidth / 2;

                    ctx.fillText(section.header1Text || 'Single', header1X, currentY);
                    ctx.fillText(section.header2Text || 'Double', header2X, currentY);

                    currentY += headerHeight;
                }

                let itemY = currentY;

                section.items.forEach((item: any, index: number) => {
                    ctx.textBaseline = 'top';

                    ctx.textAlign = 'left';
                    ctx.fillStyle = section.color;
                    ctx.font = `500 ${section.fontSize}px "${section.fontFamily || 'Arial'}"`;

                    const numberText = `${index + 1}.`;
                    const numberWidth = ctx.measureText(numberText).width + 8;

                    ctx.fillText(numberText, section.x + padding, itemY);

                    const columnWidth = section.columnWidth || 70;
                    const priceWidth = item.isDouble ? (columnWidth * 2 + columnGap) : 90;
                    const maxNameWidth = sectionWidth - padding * 2 - priceWidth - numberWidth - 15;
                    let itemName = item.name;
                    let nameWidth = ctx.measureText(itemName).width;

                    if (nameWidth > maxNameWidth) {
                        while (nameWidth > maxNameWidth && itemName.length > 0) {
                            itemName = itemName.slice(0, -1);
                            nameWidth = ctx.measureText(itemName + '...').width;
                        }
                        itemName += '...';
                    }

                    ctx.fillText(itemName, section.x + padding + numberWidth, itemY);

                    ctx.font = `bold ${section.fontSize}px "${section.fontFamily || 'Arial'}"`;

                    if (item.isDouble) {
                        ctx.textAlign = 'center';

                        const price1X = section.x + sectionWidth - padding - columnWidth * 2 - columnGap + columnWidth / 2;
                        const price2X = section.x + sectionWidth - padding - columnWidth + columnWidth / 2;

                        ctx.fillText(`₹${item.price1 || '0'}`, price1X, itemY);
                        ctx.fillText(`₹${item.price2 || '0'}`, price2X, itemY);
                    } else {
                        ctx.textAlign = 'right';
                        ctx.fillText(`₹${item.price || '0'}`, section.x + sectionWidth - padding, itemY);
                    }

                    itemY += lineHeight;
                });

                ctx.restore();
            });

            menuItems.forEach(item => {
                ctx.save();
                ctx.fillStyle = item.color;
                ctx.textBaseline = 'top';

                if (item.type === 'title') {
                    ctx.font = `bold ${item.fontSize}px "${item.fontFamily || 'Arial'}"`;
                    ctx.textAlign = item.align || 'left';

                    const textX = item.align === 'center' ? item.x + 150 :
                        item.align === 'right' ? item.x + 300 :
                            item.x;
                    ctx.fillText(item.name, textX, item.y);

                    if (item.showUnderline !== false) {
                        ctx.strokeStyle = item.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(item.x, item.y + item.fontSize + 6);
                        ctx.lineTo(item.x + 300, item.y + item.fontSize + 6);
                        ctx.stroke();
                    }
                } else {
                    ctx.font = `500 ${item.fontSize}px "${item.fontFamily || 'Arial'}"`;
                    ctx.textAlign = 'left';
                    ctx.fillText(item.name, item.x, item.y);

                    if (item.price) {
                        ctx.font = `bold ${item.fontSize}px "${item.fontFamily || 'Arial'}"`;
                        ctx.textAlign = 'right';
                        ctx.fillText(`₹${item.price}`, item.x + 300, item.y);
                    }
                }

                ctx.restore();
            });

            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `restaurant-menu-HD-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                const dpi = Math.round((finalWidth / exportWidth) * 96);
                alert(`✅ ULTRA HIGH-RESOLUTION menu exported successfully!📐 Final Dimensions: ${finalWidth} × ${finalHeight} pixels
📏 Original size: ${exportWidth} × ${exportHeight} px
🔍 Scale Factor: ${scaleFactor}x
📊 DPI Equivalent: ~${dpi} DPI (Print-Ready)
📄 Format: PNG (Maximum Quality, NO Compression)
🖨️ Professional print quality guaranteed!
✨ PERFECT ALIGNMENT FEATURES:
✓ Each table auto-sized to exact content
✓ NO fixed heights or stretching
✓ All text perfectly aligned vertically
✓ Prices aligned on right, NO overlap
✓ Clean spacing between all elements
✓ Sharp, crisp text at any zoom level
Ready for professional printing!`);
                setHasUnsavedChanges(false);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Export failed!\n\nError: ${error}\n\nPlease try again or contact support.`);
        }
    };

    const exportJSON = () => {
        const menuData = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            canvasSize: canvasSize,
            backgroundUrl: backgroundUrl,
            backgroundColor: backgroundColor,
            sections: sections,
            individualItems: menuItems,
            itemSpacing: itemSpacing,
            priceMemory: priceMemory,
            lines: lines,
            images: images,
            uniformSectionSize: uniformSectionSize
        };

        const jsonString = JSON.stringify(menuData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `menu-design-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Menu design exported as JSON successfully!');
    };

    const importMenu = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);

                if (data.sections && data.individualItems) {
                    saveToHistory();
                    setCanvasSize(data.canvasSize || { width: 600, height: 800 });
                    setBackgroundUrl(data.backgroundUrl || backgroundUrl);
                    setBackgroundColor(data.backgroundColor || '#f8f9fa');
                    setSections(data.sections);
                    setMenuItems(data.individualItems);
                    setItemSpacing(data.itemSpacing || 50);
                    setLines(data.lines || []);
                    setImages(data.images || []);
                    setUniformSectionSize(data.uniformSectionSize || { width: 400, height: 300 });
                    if (data.priceMemory) {
                        setPriceMemory(data.priceMemory);
                    }
                    setHasUnsavedChanges(false);
                    alert(`Menu imported successfully! Created on: ${new Date(data.createdAt).toLocaleString()}`);
                } else {
                    alert('Invalid menu file format');
                }
            } catch (error) {
                alert('Error reading menu file: ' + error);
            }
        };
        reader.readAsText(file);
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 1200;
                    const maxHeight = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        const widthRatio = maxWidth / width;
                        const heightRatio = maxHeight / height;
                        const ratio = Math.min(widthRatio, heightRatio);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }

                    setCanvasSize({ width, height });
                    setBackgroundUrl(event.target?.result as string);
                    alert('Background image uploaded successfully!');
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid image file (JPG, PNG, etc.)');
        }
    };

    const removeBackground = () => {
        setBackgroundUrl("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect fill='%23f8f9fa' width='600' height='800'/%3E%3Ctext x='300' y='80' font-family='Arial' font-size='32' fill='%23333' text-anchor='middle' font-weight='bold'%3ERestaurant Menu%3C/text%3E%3Crect x='50' y='120' width='500' height='2' fill='%23ddd'/%3E%3C/svg%3E");
        setCanvasSize({ width: 600, height: 800 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const generateQRCode = async () => {
        try {
            const response = await fetch(`/api/menus/${menuId}/qr`, {
                method: 'POST',
            });
            const data = await response.json();
            if (data.qrCodeUrl) {
                setQrCodeUrl(data.qrCodeUrl);
                setShowQRModal(true);
            }
        } catch (error) {
            console.error('QR generation error:', error);
            alert('Failed to generate QR code');
        }
    };

    const selectedItemData = menuItems.find(item => item.id === selectedItem);
    const selectedSectionData = sections.find(section => section.id === selectedItem);
    const selectedLineData = lines.find(line => line.id === selectedItem);
    const selectedImageData = images.find(img => img.id === selectedItem);

    const QRCodeModal = () => {
        if (!showQRModal) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ marginTop: 0, fontSize: '24px', marginBottom: '20px' }}>Share Your Menu</h2>
                    {qrCodeUrl && (
                        <img src={qrCodeUrl} alt="QR Code" style={{ width: '300px', height: '300px', margin: '0 auto 20px' }} />
                    )}
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Scan this QR code to view your menu
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <a
                            href={qrCodeUrl}
                            download="menu-qr-code.png"
                            style={{
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Download QR Code
                        </a>
                        <button
                            onClick={() => setShowQRModal(false)}
                            style={{
                                padding: '10px 20px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>
            {`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Crimson+Text:wght@400;700&family=EB+Garamond:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Cinzel:wght@400;500;600;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Alfa+Slab+One&family=Anton&family=Righteous&display=swap');
    `}
        </style>

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>QR Menu Editor System</h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={undo} disabled={historyIndex <= 0} style={{ padding: '8px 16px', background: historyIndex <= 0 ? '#e9ecef' : '#6c757d', color: historyIndex <= 0 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    ↶ Undo
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} style={{ padding: '8px 16px', background: historyIndex >= history.length - 1 ? '#e9ecef' : '#6c757d', color: historyIndex >= history.length - 1 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    ↷ Redo
                </button>
                <button onClick={() => setMode('admin')} style={{ padding: '8px 16px', background: mode === 'admin' ? '#007bff' : '#e9ecef', color: mode === 'admin' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Edit2 size={16} /> Admin Mode
                </button>
                <button onClick={() => setMode('customer')} style={{ padding: '8px 16px', background: mode === 'customer' ? '#28a745' : '#e9ecef', color: mode === 'customer' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={16} /> Customer View
                </button>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
            {mode === 'admin' && (
                <div style={{ width: '340px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', height: '100%', overflowY: 'auto', flexShrink: 0 }}>
                    <h3 style={{ marginTop: 0, fontSize: '18px' }}>Controls</h3>

                    <div style={{ marginBottom: '20px', padding: '12px', background: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                            Item Spacing: {itemSpacing}px
                        </label>
                        <input type="range" min="30" max="100" value={itemSpacing} onChange={(e) => setItemSpacing(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                    </div>

                    <button onClick={addNewItem} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                        <Plus size={16} /> Add Menu Item
                    </button>

                    <button onClick={addNewTitle} style={{ width: '100%', padding: '10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                        <Plus size={16} /> Add Section Title
                    </button>

                    <button onClick={addNewSection} style={{ width: '100%', padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                        <Plus size={16} /> Add Table Section
                    </button>

                    <button onClick={() => setDrawingLine(!drawingLine)} style={{ width: '100%', padding: '10px', background: drawingLine ? '#dc3545' : '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                        <Minus size={16} /> {drawingLine ? 'Cancel Line Drawing' : 'Draw Line'}
                    </button>

                    <button onClick={() => imageInputRef.current?.click()} style={{ width: '100%', padding: '10px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                        <Plus size={16} /> Add Image
                    </button>

                    <input ref={imageInputRef} type="file" accept="image/*" onChange={addImage} style={{ display: 'none' }} />

                    <div style={{ marginBottom: '10px', padding: '12px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                            Add Multiple Items:
                        </label>
                        <textarea value={bulkAddText} onChange={(e) => setBulkAddText(e.target.value)} placeholder="Single price:&#10;Dosa - 80&#10;Idli - 50&#10;&#10;Double price:&#10;Chicken Mandi Dry - 280 - 460&#10;Mutton Biryani - 150 - 280" style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px', minHeight: '100px', fontFamily: 'monospace', marginBottom: '8px', resize: 'vertical' }} />
                        <div style={{ fontSize: '10px', color: '#856404', marginBottom: '8px', padding: '6px', background: '#fff8e1', borderRadius: '3px' }}>
                            💡 <strong>Tip:</strong> Use 2 dashes for double pricing (Single - Double columns)
                        </div>
                        <button onClick={addBulkItems} style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                            Add All Items
                        </button>
                    </div>

                    <button onClick={saveMenu} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                        <Save size={16} /> Save Menu
                    </button>

                    <button onClick={downloadAsImage} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                        <Download size={16} /> Download as HD Image
                    </button>

                    <button
                        onClick={generateQRCode}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Share2 size={16} /> Generate QR Code & Share
                    </button>

                    <button onClick={exportJSON} style={{ width: '100%', padding: '10px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                        <Download size={16} /> Export JSON
                    </button>

                    <button onClick={() => importInputRef.current?.click()} style={{ width: '100%', padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                        <Upload size={16} /> Import Menu Design
                    </button><input ref={importInputRef} type="file" accept=".json" onChange={importMenu} style={{ display: 'none' }} />

                    <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px', marginBottom: '20px' }}>
                        <h4 style={{ marginTop: 0, fontSize: '16px', marginBottom: '12px' }}>Default Table Size</h4>
                        <p style={{ fontSize: '11px', color: '#6c757d', marginBottom: '12px' }}>Sets default size for new tables. Existing tables keep their individual sizes.</p>

                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                            Default Width: {uniformSectionSize.width}px
                            <input type="range" min="300" max="600" value={uniformSectionSize.width} onChange={(e) => { saveToHistory(); setUniformSectionSize({ ...uniformSectionSize, width: parseInt(e.target.value) }); }} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                        </label>

                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            Default Height: {uniformSectionSize.height}px
                            <input type="range" min="200" max="600" value={uniformSectionSize.height} onChange={(e) => { saveToHistory(); setUniformSectionSize({ ...uniformSectionSize, height: parseInt(e.target.value) }); }} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                        </label>

                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            Background Color:
                            <input type="color" value={backgroundColor} onChange={(e) => { const newColor = e.target.value; setBackgroundColor(newColor); setSections(sections.map(s => ({ ...s, backgroundColor: newColor }))); }} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                        </label>
                    </div>

                    <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px', marginBottom: '20px' }}>
                        <h4 style={{ marginTop: 0, fontSize: '16px', marginBottom: '12px' }}>Background Image</h4>

                        <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                            <Plus size={16} /> Upload Background
                        </button>

                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} style={{ display: 'none' }} />

                        {backgroundUrl !== "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect fill='%23f8f9fa' width='600' height='800'/%3E%3Ctext x='300' y='80' font-family='Arial' font-size='32' fill='%23333' text-anchor='middle' font-weight='bold'%3ERestaurant Menu%3C/text%3E%3Crect x='50' y='120' width='500' height='2' fill='%23ddd'/%3E%3C/svg%3E" && (
                            <button onClick={removeBackground} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px' }}>
                                <Trash2 size={14} /> Remove Background
                            </button>
                        )}
                    </div>
                    {selectedImageData && (
                            <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                                <h4 style={{ marginTop: 0, fontSize: '16px' }}>Edit Image</h4>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Width: {selectedImageData.width}px
                                    <input type="range" min="50" max="500" value={selectedImageData.width} onChange={(e) => updateImage(selectedImageData.id, 'width', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                </label>

                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Height: {selectedImageData.height}px
                                    <input type="range" min="50" max="500" value={selectedImageData.height} onChange={(e) => updateImage(selectedImageData.id, 'height', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                </label>

                                <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '12px', marginBottom: '12px' }}>
                                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>🎨 Image Adjustments</h5>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Brightness: {(selectedImageData.adjustments || defaultImageAdjustments).brightness}%
                                        <input type="range" min="0" max="200" value={(selectedImageData.adjustments || defaultImageAdjustments).brightness} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'brightness', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Contrast: {(selectedImageData.adjustments || defaultImageAdjustments).contrast}%
                                        <input type="range" min="0" max="200" value={(selectedImageData.adjustments || defaultImageAdjustments).contrast} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'contrast', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Exposure: {(selectedImageData.adjustments || defaultImageAdjustments).exposure}%
                                        <input type="range" min="0" max="200" value={(selectedImageData.adjustments || defaultImageAdjustments).exposure} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'exposure', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Saturation: {(selectedImageData.adjustments || defaultImageAdjustments).saturation}%
                                        <input type="range" min="0" max="200" value={(selectedImageData.adjustments || defaultImageAdjustments).saturation} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'saturation', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Temperature: {(selectedImageData.adjustments || defaultImageAdjustments).temperature}
                                        <input type="range" min="-100" max="100" value={(selectedImageData.adjustments || defaultImageAdjustments).temperature} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'temperature', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Sharpness: {(selectedImageData.adjustments || defaultImageAdjustments).sharpness}
                                        <input type="range" min="0" max="100" value={(selectedImageData.adjustments || defaultImageAdjustments).sharpness} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'sharpness', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Clarity: {(selectedImageData.adjustments || defaultImageAdjustments).clarity}
                                        <input type="range" min="0" max="100" value={(selectedImageData.adjustments || defaultImageAdjustments).clarity} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'clarity', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Blur: {(selectedImageData.adjustments || defaultImageAdjustments).blur}
                                        <input type="range" min="0" max="100" value={(selectedImageData.adjustments || defaultImageAdjustments).blur} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'blur', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Opacity: {(selectedImageData.adjustments || defaultImageAdjustments).opacity}%
                                        <input type="range" min="0" max="100" value={(selectedImageData.adjustments || defaultImageAdjustments).opacity} onChange={(e) => updateImageAdjustment(selectedImageData.id, 'opacity', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    <button onClick={() => { saveToHistory(); setImages(images.map(img => img.id === selectedImageData.id ? { ...img, adjustments: { ...defaultImageAdjustments } } : img)); }} style={{ width: '100%', padding: '6px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginTop: '6px' }}>
                                        Reset All Adjustments
                                    </button>
                                </div>

                                <button onClick={() => deleteImage(selectedImageData.id)} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                    <Trash2 size={16} /> Delete Image
                                </button>
                            </div>
                        )}

                        {selectedLineData && !selectedImageData && (
                            <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                                <h4 style={{ marginTop: 0, fontSize: '16px' }}>Edit Line</h4>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Line Color:
                                    <input type="color" value={selectedLineData.color} onChange={(e) => updateLine(selectedLineData.id, 'color', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                                </label>

                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Line Thickness: {selectedLineData.thickness}px
                                    <input type="range" min="1" max="10" value={selectedLineData.thickness} onChange={(e) => updateLine(selectedLineData.id, 'thickness', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                </label>

                                <button onClick={() => deleteLine(selectedLineData.id)} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                    <Trash2 size={16} /> Delete Line
                                </button>
                            </div>
                        )}

                        {selectedSectionData && !selectedImageData && !selectedLineData && (
                            <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                                <h4 style={{ marginTop: 0, fontSize: '16px', marginBottom: '4px' }}>Edit Table Section</h4>
                                <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '4px', marginBottom: '12px', fontSize: '11px', color: '#856404' }}>
                                    ⚡ This table's size is independent from others
                                </div>

                                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #b8daff' }}>
                                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#004085', fontWeight: 'bold' }}>📝 Column Headers (Double Price Items)</h5>

                                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                        <input type="checkbox" checked={selectedSectionData.showColumnHeaders !== false} onChange={(e) => updateSection(selectedSectionData.id, 'showColumnHeaders', e.target.checked)} style={{ cursor: 'pointer' }} />
                                        Show Column Headers
                                    </label>

                                    {selectedSectionData.showColumnHeaders !== false && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        First Column Label:
                                                        <input type="text" value={selectedSectionData.header1Text || 'Single'} onChange={(e) => updateSection(selectedSectionData.id, 'header1Text', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        Second Column Label:
                                                        <input type="text" value={selectedSectionData.header2Text || 'Double'} onChange={(e) => updateSection(selectedSectionData.id, 'header2Text', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                            </div>

                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Header Font:
                                                <select value={selectedSectionData.headerFontFamily || 'Arial'} onChange={(e) => updateSection(selectedSectionData.id, 'headerFontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                                    {availableFonts.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Header Font Size: {selectedSectionData.headerFontSize || 14}px
                                                <input type="range" min="10" max="20" value={selectedSectionData.headerFontSize || 14} onChange={(e) => updateSection(selectedSectionData.id, 'headerFontSize', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                            </label>

                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Header Color:
                                                <input type="color" value={selectedSectionData.headerColor || selectedSectionData.color} onChange={(e) => updateSection(selectedSectionData.id, 'headerColor', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                                            </label>

                                            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                                <input type="checkbox" checked={selectedSectionData.headerBold !== false} onChange={(e) => updateSection(selectedSectionData.id, 'headerBold', e.target.checked)} style={{ cursor: 'pointer' }} />
                                                Bold Headers
                                            </label>

                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Column Spacing: {selectedSectionData.columnGap || 8}px
                                                <input type="range" min="4" max="30" value={selectedSectionData.columnGap || 8} onChange={(e) => updateSection(selectedSectionData.id, 'columnGap', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                            </label>
                                        </>
                                    )}
                                </div>

                                <div style={{ marginBottom: '16px', padding: '12px', background: '#e7f3ff', borderRadius: '6px', border: '1px solid #b8daff' }}>
                                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#004085', fontWeight: 'bold' }}>📐 Table Size (This Table Only)</h5>

                                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                        <input type="checkbox" checked={selectedSectionData.useAutoHeight !== false} onChange={(e) => updateSection(selectedSectionData.id, 'useAutoHeight', e.target.checked)} style={{ cursor: 'pointer' }} />
                                        Auto-Height (Recommended - Fits All Items)
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Width: {selectedSectionData.width || uniformSectionSize.width}px
                                        <input type="range" min="250" max="700" value={selectedSectionData.width || uniformSectionSize.width} onChange={(e) => updateSection(selectedSectionData.id, 'width', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                    </label>

                                    {selectedSectionData.useAutoHeight === false && (
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Height (Manual): {selectedSectionData.height || uniformSectionSize.height}px
                                            <input type="range" min="150" max="700" value={selectedSectionData.height || uniformSectionSize.height} onChange={(e) => updateSection(selectedSectionData.id, 'height', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                        </label>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', marginBottom: '4px', color: '#004085' }}>Width (px):</label>
                                            <input type="number" min="250" max="700" value={selectedSectionData.width || uniformSectionSize.width} onChange={(e) => updateSection(selectedSectionData.id, 'width', parseInt(e.target.value) || 400)} style={{ width: '100%', padding: '6px', border: '1px solid #b8daff', borderRadius: '4px', fontSize: '12px' }} />
                                        </div>
                                        {selectedSectionData.useAutoHeight === false && (
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', marginBottom: '4px', color: '#004085' }}>Height (px):</label>
                                                <input type="number" min="150" max="700" value={selectedSectionData.height || uniformSectionSize.height} onChange={(e) => updateSection(selectedSectionData.id, 'height', parseInt(e.target.value) || 300)} style={{ width: '100%', padding: '6px', border: '1px solid #b8daff', borderRadius: '4px', fontSize: '12px' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Section Title:
                                    <input type="text" value={selectedSectionData.title} onChange={(e) => updateSection(selectedSectionData.id, 'title', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                    <input type="checkbox" checked={selectedSectionData.showUnderline !== false} onChange={(e) => updateSection(selectedSectionData.id, 'showUnderline', e.target.checked)} style={{ cursor: 'pointer' }} />
                                    Show Underline
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                    <input type="checkbox" checked={selectedSectionData.showBorder !== false} onChange={(e) => updateSection(selectedSectionData.id, 'showBorder', e.target.checked)} style={{ cursor: 'pointer' }} />
                                    Show Border
                                </label>

                                {selectedSectionData.showBorder !== false && (
                                    <>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Border Thickness: {selectedSectionData.borderThickness || 1}px
                                            <input type="range" min="1" max="5" value={selectedSectionData.borderThickness || 1} onChange={(e) => updateSection(selectedSectionData.id, 'borderThickness', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                        </label>

                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Border Padding: {selectedSectionData.borderPadding || 16}px
                                            <input type="range" min="8" max="32" value={selectedSectionData.borderPadding || 16} onChange={(e) => updateSection(selectedSectionData.id, 'borderPadding', parseInt(e.target.value))} style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }} />
                                        </label>

                                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Border Color:
                                            <input type="color" value={selectedSectionData.borderColor} onChange={(e) => updateSection(selectedSectionData.id, 'borderColor', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                                        </label>
                                    </>
                                )}

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Line Spacing:
                                    <input type="number" step="0.1" min="1" max="3" value={selectedSectionData.lineSpacing} onChange={(e) => updateSection(selectedSectionData.id, 'lineSpacing', parseFloat(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                                </label>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Title Font:
                                    <select value={selectedSectionData.titleFontFamily || 'Georgia'} onChange={(e) => updateSection(selectedSectionData.id, 'titleFontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                        {availableFonts.map(font => (
                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Title Size:
                                    <input type="number" value={selectedSectionData.titleFontSize} onChange={(e) => updateSection(selectedSectionData.id, 'titleFontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                                </label>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Items Font:
                                    <select value={selectedSectionData.fontFamily || 'Arial'} onChange={(e) => updateSection(selectedSectionData.id, 'fontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                        {availableFonts.map(font => (
                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Items Size:
                                    <input type="number" value={selectedSectionData.fontSize} onChange={(e) => updateSection(selectedSectionData.id, 'fontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                                </label>

                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Text Color:
                                    <input type="color" value={selectedSectionData.color} onChange={(e) => updateSection(selectedSectionData.id, 'color', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                                </label>

                                <div style={{ marginBottom: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Add Items to Section:
                                    </label>

                                    <div style={{ marginBottom: '8px', padding: '8px', background: '#e7f3ff', borderRadius: '4px', fontSize: '10px' }}>
                                        <strong>💡 Format Options:</strong>
                                        <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                                            • Single price: <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '2px' }}>Item Name - 100</code>
                                            <br />
                                            • Double price: <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '2px' }}>Item Name - 300 - 600</code>
                                        </div>
                                    </div>

                                    <textarea value={bulkAddText} onChange={(e) => setBulkAddText(e.target.value)} placeholder="Single pricing:&#10;Dosa - 80&#10;&#10;Double pricing:&#10;Chicken Mandi - 300 - 600&#10;Mutton Biryani - 150 - 280" style={{ width: '100%', padding: '6px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '11px', minHeight: '80px', fontFamily: 'monospace', marginBottom: '6px', resize: 'vertical' }} />
                                    <button onClick={() => addItemsToSection(selectedSectionData.id)} style={{ width: '100%', padding: '6px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                                        Add Items
                                    </button>
                                </div>

                                {selectedSectionData.items.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                            Current Items ({selectedSectionData.items.length}):
                                        </label>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                                            {selectedSectionData.items.map((item: any, index: number) => (
                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', borderBottom: '1px solid #dee2e6', marginBottom: '4px' }}>
                                                    <span style={{ flex: 1, cursor: 'pointer', textDecoration: selectedSectionItem?.sectionId === selectedSectionData.id && selectedSectionItem?.itemIndex === index ? 'underline' : 'none' }} onClick={() => setSelectedSectionItem({ sectionId: selectedSectionData.id, itemIndex: index })}>
                                                        {item.name} - {item.isDouble ? `₹${item.price1 || '0'} / ₹${item.price2 || '0'}` : `₹${item.price || '0'}`}
                                                    </span>
                                                    <button onClick={() => deleteItemFromSection(selectedSectionData.id, index)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedSectionItem && selectedSectionItem.sectionId === selectedSectionData.id && (
                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#e7f3ff', borderRadius: '4px', border: '1px solid #b8daff' }}>
<h5 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>Edit Item: {selectedSectionData.items[selectedSectionItem.itemIndex]?.name}</h5><label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Item Name:
                                        <input type="text" value={selectedSectionData.items[selectedSectionItem.itemIndex]?.name || ''} onChange={(e) => updateSectionItem(selectedSectionData.id, selectedSectionItem.itemIndex, 'name', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }} />
                                    </label>

                                    {selectedSectionData.items[selectedSectionItem.itemIndex]?.isDouble ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                    Price 1:
                                                    <input type="text" value={selectedSectionData.items[selectedSectionItem.itemIndex]?.price1 || ''} onChange={(e) => updateSectionItem(selectedSectionData.id, selectedSectionItem.itemIndex, 'price1', e.target.value.replace(/[^\d]/g, ''))} style={{ width: '100%', padding: '4px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }} />
                                                </label>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                    Price 2:
                                                    <input type="text" value={selectedSectionData.items[selectedSectionItem.itemIndex]?.price2 || ''} onChange={(e) => updateSectionItem(selectedSectionData.id, selectedSectionItem.itemIndex, 'price2', e.target.value.replace(/[^\d]/g, ''))} style={{ width: '100%', padding: '4px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }} />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                            Price:
                                            <input type="text" value={selectedSectionData.items[selectedSectionItem.itemIndex]?.price || ''} onChange={(e) => updateSectionItem(selectedSectionData.id, selectedSectionItem.itemIndex, 'price', e.target.value.replace(/[^\d]/g, ''))} style={{ width: '100%', padding: '4px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }} />
                                        </label>
                                    )}

                                    <button onClick={() => setSelectedSectionItem(null)} style={{ width: '100%', padding: '6px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                                        Close Editor
                                    </button>
                                </div>
                            )}

                            <button onClick={() => deleteSection(selectedSectionData.id)} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                <Trash2 size={16} /> Delete Section
                            </button>
                        </div>
                    )}

                    {selectedSections.length > 0 && !selectedSectionData && !selectedLineData && !selectedImageData && selectedItems.length === 0 && (
                        <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                            <h4 style={{ marginTop: 0, fontSize: '16px' }}>
                                Edit Multiple Tables ({selectedSections.length})
                            </h4>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Family:
                                <select onChange={(e) => updateMultipleSections('fontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                    <option value="">-- Select Font --</option>
                                    {availableFonts.map(font => (
                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Size:
                                <input type="number" placeholder="Enter size..." onChange={(e) => e.target.value && updateMultipleSections('fontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Border Color:
                                <input type="color" onChange={(e) => updateMultipleSections('borderColor', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                Text Color:
                                <input type="color" onChange={(e) => updateMultipleSections('color', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                            </label>

                            <button onClick={() => setSelectedSections([])} style={{ width: '100%', padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>
                                Clear Selection
                            </button>

                            <button onClick={deleteMultipleSections} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                <Trash2 size={16} /> Delete Selected Tables
                            </button>
                        </div>
                    )}

                    {selectedItems.length > 0 && !selectedSectionData && !selectedLineData && !selectedImageData && (
                        <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                            <h4 style={{ marginTop: 0, fontSize: '16px' }}>
                                Edit Multiple Items ({selectedItems.length})
                            </h4>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Family:
                                <select onChange={(e) => updateMultipleItems('fontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                    <option value="">-- Select Font --</option>
                                    {availableFonts.map(font => (
                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Size:
                                <input type="number" placeholder="Enter size..." onChange={(e) => e.target.value && updateMultipleItems('fontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Color:
                                <input type="color" onChange={(e) => updateMultipleItems('color', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                            </label>

                            <button onClick={() => setSelectedItems([])} style={{ width: '100%', padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>
                                Clear Selection
                            </button>

                            <button onClick={deleteMultipleItems} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                <Trash2 size={16} /> Delete Selected
                            </button>
                        </div>
                    )}

                    {selectedItemData && !selectedSectionData && !selectedLineData && !selectedImageData && (
                        <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
                            <h4 style={{ marginTop: 0, fontSize: '16px' }}>
                                Edit {selectedItemData.type === 'title' ? 'Section Title' : 'Menu Item'}
                            </h4>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                {selectedItemData.type === 'title' ? 'Title Text:' : 'Item Name:'}
                                <input type="text" value={selectedItemData.name} onChange={(e) => updateItem(selectedItemData.id, 'name', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                            </label>

                            {selectedItemData.type === 'item' && (
                                <>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Price Type:
                                        <select value={selectedItemData.priceType || 'single'} onChange={(e) => {
                                            const newType = e.target.value;
                                            if (newType === 'double') {
                                                updateItem(selectedItemData.id, 'priceType', 'double');
                                                updateItem(selectedItemData.id, 'price1', selectedItemData.price || '0');
                                                updateItem(selectedItemData.id, 'price2', '0');
                                                updateItem(selectedItemData.id, 'label1', 'Single');
                                                updateItem(selectedItemData.id, 'label2', 'Double');
                                            } else {
                                                updateItem(selectedItemData.id, 'priceType', 'single');
                                                updateItem(selectedItemData.id, 'price', (selectedItemData as any).price1 || selectedItemData.price || '0');
                                            }
                                        }} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                            <option value="single">Single Price</option>
                                            <option value="double">Double Price (2 columns)</option>
                                        </select>
                                    </label>

                                    {selectedItemData.priceType === 'double' ? (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        Label 1:
                                                        <input type="text" value={(selectedItemData as any).label1 || 'Single'} onChange={(e) => updateItem(selectedItemData.id, 'label1', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        Label 2:
                                                        <input type="text" value={(selectedItemData as any).label2 || 'Double'} onChange={(e) => updateItem(selectedItemData.id, 'label2', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        Price 1:
                                                        <input type="text" value={(selectedItemData as any).price1 || '0'} onChange={(e) => updateItem(selectedItemData.id, 'price1', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        Price 2:
                                                        <input type="text" value={(selectedItemData as any).price2 || '0'} onChange={(e) => updateItem(selectedItemData.id, 'price2', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }} />
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Price:
                                            <input type="text" value={selectedItemData.price} onChange={(e) => updateItem(selectedItemData.id, 'price', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                                        </label>
                                    )}
                                </>
                            )}

                            {selectedItemData.type === 'title' && (
                                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                    <input type="checkbox" checked={(selectedItemData as any).showUnderline !== false} onChange={(e) => updateItem(selectedItemData.id, 'showUnderline', e.target.checked)} style={{ cursor: 'pointer' }} />
                                    Show Underline
                                </label>
                            )}

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Family:
                                <select value={selectedItemData.fontFamily || 'Arial'} onChange={(e) => updateItem(selectedItemData.id, 'fontFamily', e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                    {availableFonts.map(font => (
                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                Font Size:
                                <input type="number" value={selectedItemData.fontSize} onChange={(e) => updateItem(selectedItemData.id, 'fontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                Color:
                                <input type="color" value={selectedItemData.color} onChange={(e) => updateItem(selectedItemData.id, 'color', e.target.value)} style={{ width: '100%', padding: '4px', marginTop: '4px', border: '1px solid #ced4da', borderRadius: '4px', height: '40px', cursor: 'pointer' }} />
                            </label>

                            <button onClick={() => deleteItem(selectedItemData.id)} style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px' }}>
                                <Trash2 size={16} /> Delete {selectedItemData.type === 'title' ? 'Title' : 'Item'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowY: 'auto', overflowX: 'auto', height: '100%', padding: '20px 0' }}>
                <div ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} style={{ position: 'relative', width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, background: '#fff', border: '2px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: drawingLine ? 'crosshair' : mode === 'admin' ? 'default' : 'auto', flexShrink: 0, margin: '0 auto' }}>
                    <img src={backgroundUrl} alt="Menu background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />

                    {images.map(image => (
                        <img key={image.id} src={image.src} onMouseDown={(e) => mode === 'admin' && !drawingLine && handleMouseDown(e, image)} onClick={(e) => { if (mode === 'admin' && !drawingLine) { e.stopPropagation(); setSelectedItem(image.id); setSelectedItems([]); } }} style={{ position: 'absolute', left: `${image.x}px`, top: `${image.y}px`, width: `${image.width}px`, height: `${image.height}px`, cursor: mode === 'admin' && !drawingLine ? 'move' : 'default', border: mode === 'admin' && selectedItem === image.id ? '2px solid #fd7e14' : 'none', objectFit: 'cover', pointerEvents: mode === 'admin' && !drawingLine ? 'auto' : 'none', ...getImageFilterStyle(image.adjustments) }} />
                    ))}

                    {lines.map(line => (
                        <svg key={line.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: mode === 'admin' ? 'auto' : 'none' }}>
                            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth={line.thickness} style={{ cursor: mode === 'admin' ? 'move' : 'default' }} onClick={() => mode === 'admin' && setSelectedItem(line.id)} />
                        </svg>
                    ))}

                    {currentLine && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            <line x1={currentLine.x1} y1={currentLine.y1} x2={currentLine.x2} y2={currentLine.y2} stroke="#000000" strokeWidth={2} strokeDasharray="5,5" />
                        </svg>
                    )}

                    {sections.map(section => {
                        const sectionWidth = section.width || uniformSectionSize.width;
                        const padding = section.borderPadding || 16;
                        const titleHeight = section.titleFontSize + 30;
                        const lineHeight = section.fontSize * (section.lineSpacing || 1.5);
                        const itemsHeight = section.items.length * lineHeight + 10;
                        const autoHeight = titleHeight + itemsHeight + (padding * 2);
                        const sectionHeight = section.useAutoHeight !== false ? autoHeight : (section.height || uniformSectionSize.height);
                        const isSelected = mode === 'admin' && selectedItem === section.id;
                        const isMultiSelected = mode === 'admin' && selectedSections.includes(section.id);
                        const columnGap = section.columnGap || 8;

                        return (
                            <div key={section.id} onMouseDown={(e) => mode === 'admin' && !drawingLine && handleMouseDown(e, section)} onClick={(e) => { if (mode === 'admin' && !drawingLine) { e.stopPropagation(); if (e.ctrlKey || e.metaKey) { toggleSectionSelection(section.id); } else { setSelectedItem(section.id); setSelectedItems([]); setSelectedSections([]); } } }} style={{ position: 'absolute', left: `${section.x}px`, top: `${section.y}px`, width: `${sectionWidth}px`, height: `${sectionHeight}px`, padding: `${padding}px`, cursor: mode === 'admin' && !drawingLine ? 'move' : 'default', border: isSelected || isMultiSelected ? '3px solid #28a745' : section.showBorder !== false ? `${section.borderThickness || 1}px solid ${section.borderColor}` : 'none', background: section.backgroundColor || backgroundColor, borderRadius: '8px', userSelect: 'none', pointerEvents: mode === 'admin' && !drawingLine ? 'auto' : 'none', overflow: 'visible', boxSizing: 'border-box', boxShadow: isSelected || isMultiSelected ? '0 0 15px rgba(40, 167, 69, 0.4)' : 'none', transition: 'box-shadow 0.2s, border 0.2s' }}>
                                {mode === 'admin' && (
                                    <input type="checkbox" checked={selectedSections.includes(section.id)} onChange={() => toggleSectionSelection(section.id)} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer', width: '18px', height: '18px', zIndex: 10 }} />
                                )}
                                <div style={{ fontSize: `${section.titleFontSize}px`, fontFamily: section.titleFontFamily || 'Georgia', fontWeight: 'bold', color: section.color, textTransform: 'uppercase', letterSpacing: `${section.letterSpacing || 0}px`, marginBottom: '12px', textAlign: section.align || 'left', borderBottom: section.showUnderline !== false ? `2px solid ${section.borderColor}` : 'none', paddingBottom: '8px' }}>
                                    {section.title}
                                </div>

                                {section.showColumnHeaders !== false && section.items.some((item: any) => item.isDouble) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: `1fr ${(section.columnWidth || 70) * 2 + columnGap}px`, gap: `${columnGap}px`, marginBottom: '12px', paddingBottom: '6px' }}>
                                        <div></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${columnGap}px`, fontSize: `${section.headerFontSize || 14}px`, fontFamily: section.headerFontFamily || 'Arial', color: section.headerColor || section.color, fontWeight: section.headerBold !== false ? 'bold' : 'normal', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <div style={{ textAlign: 'center' }}>{section.header1Text || 'Single'}</div>
                                            <div style={{ textAlign: 'center' }}>{section.header2Text || 'Double'}</div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: `auto 1fr ${(section.columnWidth || 70) * 2 + columnGap}px`, gap: `${columnGap}px`, rowGap: `${(section.lineSpacing || 1.5) * 8}px` }}>
                                    {section.items.map((item: any, index: number) => (
                                        <React.Fragment key={index}>
                                            <div style={{ fontSize: `${section.fontSize}px`, fontFamily: section.fontFamily || 'Arial', color: section.color, fontWeight: '500', textAlign: 'left', paddingRight: '8px' }}>
                                                {index + 1}.
                                            </div>
                                            <div style={{ fontSize: `${section.fontSize}px`, fontFamily: section.fontFamily || 'Arial', color: section.color, letterSpacing: `${section.letterSpacing || 0}px`, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                                                {item.name}
                                            </div>
                                            {item.isDouble ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${columnGap}px`, fontSize: `${section.fontSize}px`, fontFamily: section.fontFamily || 'Arial', color: section.color, fontWeight: 'bold' }}>
                                                    <div style={{ textAlign: 'center' }}>₹{String(item.price1 || '0')}</div>
                                                    <div style={{ textAlign: 'center' }}>₹{String(item.price2 || '0')}</div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: `${section.fontSize}px`, fontFamily: section.fontFamily || 'Arial', color: section.color, fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    ₹{String(item.price || '0')}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {menuItems.map(item => (
                        <div key={item.id} onMouseDown={(e) => mode === 'admin' && !drawingLine && handleMouseDown(e, item)} onClick={(e) => { if (mode === 'admin' && !drawingLine) { if (e.ctrlKey || e.metaKey) { toggleItemSelection(item.id); } else { setSelectedItem(item.id); setSelectedItems([]); } } }} style={{ position: 'absolute', left: `${item.x}px`, top: `${item.y}px`, padding: '8px 12px', cursor: mode === 'admin' && !drawingLine ? 'move' : 'default', border: mode === 'admin' && (selectedItem === item.id || selectedItems.includes(item.id)) ? '2px solid #28a745' : mode === 'admin' ? '2px dashed transparent' : 'none', background: mode === 'admin' && (selectedItem === item.id || selectedItems.includes(item.id)) ? 'rgba(40, 167, 69, 0.1)' : mode === 'admin' ? 'rgba(0, 123,255, 0.05)' : 'transparent', borderRadius: '4px', transition: 'background 0.2s', userSelect: 'none', minWidth: item.priceType === 'double' ? '450px' : '300px', pointerEvents: mode === 'admin' && !drawingLine ? 'auto' : 'none' }} onMouseEnter={(e) => { if (mode === 'admin' && selectedItem !== item.id && !selectedItems.includes(item.id)) { e.currentTarget.style.borderColor = '#007bff'; } }} onMouseLeave={(e) => { if (mode === 'admin' && selectedItem !== item.id && !selectedItems.includes(item.id)) { e.currentTarget.style.borderColor = 'transparent'; } }}>
{item.type === 'title' ? (
<div style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: 'bold', fontFamily: item.fontFamily || 'Arial', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: mode === 'customer' && (item as any).showUnderline !== false ? '2px solid currentColor' : 'none', paddingBottom: mode === 'customer' && (item as any).showUnderline !== false ? '4px' : '0', textAlign: item.align || 'left' }}>
{item.name}
</div>
) : item.priceType === 'double' ? (
<div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '15px', alignItems: 'center' }}>
<span style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: '500', fontFamily: item.fontFamily || 'Arial', textAlign: 'left' }}>
{item.name}
</span>
<div style={{ textAlign: 'center', minWidth: '90px' }}>
<div style={{ fontSize: `${Math.max(10, item.fontSize - 4)}px`, color: item.color, fontWeight: 'bold', marginBottom: '4px', opacity: 0.7 }}>
{(item as any).label1 || 'Single'}
</div>
<div style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: 'bold', fontFamily: item.fontFamily || 'Arial' }}>
₹{String((item as any).price1 || '0')}
</div>
</div>
<div style={{ textAlign: 'center', minWidth: '90px' }}>
<div style={{ fontSize: `${Math.max(10, item.fontSize - 4)}px`, color: item.color, fontWeight: 'bold', marginBottom: '4px', opacity: 0.7 }}>
{(item as any).label2 || 'Double'}
</div>
<div style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: 'bold', fontFamily: item.fontFamily || 'Arial' }}>
₹{String((item as any).price2 || '0')}
</div>
</div>
</div>
</div>
) : (
<div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px', alignItems: 'center' }}>
<span style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: '500', fontFamily: item.fontFamily || 'Arial', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
{item.name}
</span>
{item.price && (
<span style={{ fontSize: `${item.fontSize}px`, color: item.color, fontWeight: 'bold', fontFamily: item.fontFamily || 'Arial', textAlign: 'right', whiteSpace: 'nowrap' }}>
₹{item.price}
</span>
)}
</div>
)}
{mode === 'admin' && (
<input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItemSelection(item.id)} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer', width: '16px', height: '16px' }} />
)}
</div>
))}
</div>
</div>
</div>
<div style={{ marginTop: '20px', flexShrink: 0 }}>
            <button onClick={() => setShowInstructions(!showInstructions)} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: showInstructions ? '15px' : '0' }}>
                {showInstructions ? '▼ Hide Instructions' : '▶ Show Instructions'}
            </button>

            {showInstructions && (
                <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '8px', fontSize: '14px' }}>
                    <strong>✨ Advanced Features:</strong>
                    <ul style={{ marginTop: '10px', marginBottom: 0 }}>
                        <li>↶↷ <strong>Undo/Redo:</strong> Click the Undo and Redo buttons at the top to reverse or restore changes</li>
                        <li>💾 <strong>Auto-save:</strong> Your work is automatically saved every 30 seconds and after every change (2 second delay)</li>
                        <li>🖼️ <strong>Add Images:</strong> Click "Add Image" to upload food photos or decorative elements - resize and reposition as needed</li>
                        <li>📐 <strong>Individual Table Sizes:</strong> Each table has its own width/height controls (250-700px) - select a table to adjust its unique size</li>
                        <li>📏 <strong>Default Table Size:</strong> Set default dimensions for new tables in "Default Table Size" - existing tables keep their own sizes</li>
                        <li>🎨 <strong>Fixed Background Color:</strong> Table backgrounds stay consistent with menu background - change it in settings</li>
                        <li>✏️ <strong>Draw lines:</strong> Click "Draw Line" button, then click and drag on canvas to create custom divider lines</li>
                        <li>✅ <strong>Multi-select editing:</strong> Use checkboxes on items/tables or Ctrl/Cmd+Click to select multiple elements at once</li>
                        <li>📊 <strong>Column Headers:</strong> Customize "Single/Double" labels, fonts, colors, and spacing between price columns</li>
                        <li>↔️ <strong>Column Spacing:</strong> Adjust gap between Single and Double price columns (4-30px) for better readability</li>
                        <li>✨ <strong>Visual Feedback:</strong> Selected tables highlight with green glow for easy identification during resizing</li>
                        <li>💾 <strong>Everything exports:</strong> All features including individual sizes, headers, and spacing work in HD image and JSON exports</li>
                    </ul>
                    <div style={{ marginTop: '12px', padding: '10px', background: '#fff3cd', borderRadius: '4px', fontSize: '13px' }}>
                        <strong>💡 Tips:</strong>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                            <li>Auto-save prevents data loss - no manual saving needed!</li>
                            <li>Use Undo/Redo to experiment safely with different table sizes</li>
                            <li>Each table scrolls internally if items exceed its height</li>
                            <li>Use sliders for quick adjustments or number inputs for precise values</li>
                            <li>Create varied layouts by giving different sections unique sizes</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>

        <QRCodeModal />
    </div>
    );
};

export default MenuEditor;
