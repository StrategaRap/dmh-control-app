import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Camera, X, Image, Plus, Calendar, User, RefreshCw } from 'lucide-react';
import { getSavedScriptUrl } from '../services/storageService';
import { DEFAULT_API_URL, generateUUID } from '../constants';

interface LogbookFormProps {
    onBack: () => void;
}

interface LogbookEntry {
    id: string;
    date: string;
    title: string;
    description: string;
    responsible: string;
    photoUrl?: string;
    timestamp?: string;
}

// Sub-componente para mostrar la lista de eventos
const EventListView: React.FC<{
    onNewEvent: () => void;
    onBack: () => void;
}> = ({ onNewEvent, onBack }) => {
    const [events, setEvents] = useState<LogbookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;

            if (!scriptUrl || scriptUrl.includes("INSERT_YOUR")) {
                setError("URL del Script no configurada");
                setIsLoading(false);
                return;
            }

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({ type: 'logbook_fetch', data: {} }),
                redirect: "follow",
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const text = await response.text();

            if (text.trim().startsWith("<") || text.includes("<!DOCTYPE html>")) {
                setError("Error de permisos en el Script");
                setIsLoading(false);
                return;
            }

            const result = JSON.parse(text);

            if (result.success && result.data) {
                // Ordenar por fecha descendente (más reciente primero)
                const sortedEvents = result.data.sort((a: LogbookEntry, b: LogbookEntry) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setEvents(sortedEvents);
            } else {
                setEvents([]);
            }
        } catch (e) {
            console.error("Error fetching events:", e);
            setError("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-4"></div>
                        <p className="font-bold text-slate-700">Cargando eventos...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bitácora</h1>
                        <p className="text-xs text-slate-400 mt-1">Registro de eventos e incidentes</p>
                    </div>
                    <button
                        onClick={fetchEvents}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                        title="Actualizar"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Botón Nuevo Evento */}
                <button
                    onClick={onNewEvent}
                    className="w-full bg-brand-primary text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-blue-800 transition-all transform hover:scale-[1.01] active:scale-95 uppercase text-sm tracking-wide flex items-center justify-center mb-6"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Evento
                </button>

                {/* Lista de eventos */}
                {events.length === 0 && !isLoading && !error ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <div className="text-slate-400 mb-4">
                            <Calendar className="w-12 h-12 mx-auto" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay eventos registrados</p>
                        <p className="text-slate-400 text-sm mt-1">Presiona "Nuevo Evento" para crear el primero</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {formatDate(event.date)}
                                        </span>
                                    </div>

                                    {event.description && (
                                        <p className="text-slate-600 text-sm mb-3 line-clamp-3">{event.description}</p>
                                    )}

                                    <div className="flex items-center text-xs text-slate-500">
                                        <User className="w-4 h-4 mr-1" />
                                        <span>{event.responsible}</span>
                                    </div>

                                    {event.photoUrl && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <a
                                                href={event.photoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center"
                                            >
                                                <Image className="w-4 h-4 mr-1" />
                                                Ver fotografía adjunta
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-4xl mx-auto flex justify-start">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-sm uppercase tracking-wide">Volver</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sub-componente para el formulario de nuevo evento
const NewEventForm: React.FC<{
    onBack: () => void;
    onSaved: () => void;
}> = ({ onBack, onSaved }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string>('');
    const [photoName, setPhotoName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        id: generateUUID(),
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        responsible: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPhotoPreview(base64);
            const base64Data = base64.split(',')[1];
            setPhotoBase64(base64Data);
            setPhotoName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPhotoPreview(null);
        setPhotoBase64('');
        setPhotoName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!formData.date || !formData.title || !formData.responsible) {
            alert('Por favor completa los campos obligatorios: Fecha, Título y Responsable');
            return;
        }

        setIsSaving(true);

        try {
            const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;

            if (!scriptUrl || scriptUrl.includes("INSERT_YOUR")) {
                alert('❌ URL del Script no configurada. Ve a Configuración.');
                setIsSaving(false);
                return;
            }

            const payload = {
                type: 'logbook_entry',
                data: {
                    id: formData.id,
                    date: formData.date,
                    title: formData.title,
                    description: formData.description,
                    responsible: formData.responsible,
                    photoBase64: photoBase64,
                    photoName: photoName || `bitacora_${formData.id}.jpg`
                }
            };

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: "follow",
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const text = await response.text();

            if (text.trim().startsWith("<") || text.includes("<!DOCTYPE html>")) {
                alert('❌ Error de permisos en el Script.');
                setIsSaving(false);
                return;
            }

            const result = JSON.parse(text);

            if (result.success) {
                alert('✅ Evento registrado correctamente');
                onSaved();
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving logbook entry:', error);
            alert(`❌ Error de conexión: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nuevo Evento</h1>
                    <p className="text-xs text-slate-400 mt-1">Registrar nuevo evento en bitácora</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Fecha */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Fecha *</h3>
                    </div>
                    <div className="p-5">
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => handleInputChange('date', e.target.value)}
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Título */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Título *</h3>
                    </div>
                    <div className="p-5">
                        <input
                            type="text"
                            placeholder="Ej: Fuga en amortiguador."
                            value={formData.title}
                            onChange={e => handleInputChange('title', e.target.value)}
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Descripción */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Descripción</h3>
                    </div>
                    <div className="p-5">
                        <textarea
                            placeholder="Describe el evento o incidente en detalle..."
                            value={formData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Responsable */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Responsable *</h3>
                    </div>
                    <div className="p-5">
                        <input
                            type="text"
                            placeholder="Nombre del responsable"
                            value={formData.responsible}
                            onChange={e => handleInputChange('responsible', e.target.value)}
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Fotografía */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
                        <Camera className="w-5 h-5 text-slate-500 mr-2" />
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Fotografía</h3>
                    </div>
                    <div className="p-5">
                        {!photoPreview ? (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <Image className="w-12 h-12 text-slate-400 mb-4" />
                                <p className="text-slate-500 text-sm mb-4 text-center">
                                    Captura o selecciona una imagen
                                </p>
                                <label className="cursor-pointer bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide flex items-center">
                                    <Camera className="w-5 h-5 mr-2" />
                                    Tomar Foto / Seleccionar
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoCapture}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={photoPreview}
                                    alt="Vista previa"
                                    className="w-full max-h-64 object-contain rounded-lg border border-slate-200"
                                />
                                <button
                                    onClick={removePhoto}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <p className="text-xs text-slate-500 mt-2 text-center">{photoName}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-sm uppercase tracking-wide">Cancelar</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide"
                    >
                        <Save className="mr-2 w-5 h-5" />
                        {isSaving ? 'Guardando...' : 'Guardar Evento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente principal
export const LogbookForm: React.FC<LogbookFormProps> = ({ onBack }) => {
    const [view, setView] = useState<'list' | 'new'>('list');

    if (view === 'new') {
        return (
            <NewEventForm
                onBack={() => setView('list')}
                onSaved={() => setView('list')}
            />
        );
    }

    return (
        <EventListView
            onNewEvent={() => setView('new')}
            onBack={onBack}
        />
    );
};
