'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './aiagent.module.css';
import {X, Send, Legalito, RotateBack, Trash, Plus, Check, ArrowDown} from '@/app/components/svg';
import {useAuth} from '@/context/AuthContext';
import {useFirmId} from '@/hooks/useFirmId';
import {API_BASE_URL} from '@/lib/constants';

interface ChatMessage
{
    role: 'user' | 'assistant';
    content: string;
}

const WELCOME: ChatMessage = {
    role: 'assistant',
    content: '¡Hola! Soy **Legalito**, tu asistente jurídico. Puedo ayudarte con preguntas sobre la legislación colombiana y los documentos de tu biblioteca. ¿En qué te puedo ayudar?'
};

const renderMarkdown = (text: string) =>
    text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');

interface ModifyBlock {
    accion:      'insertar_despues' | 'insertar_antes' | 'reemplazar';
    buscar:      string;
    contenido:   string;
    reemplazos?: Array<{buscar: string; reemplazar: string}>;
    descripcion: string;
}

type MessagePart =
    | {type: 'text';   value: string}
    | {type: 'insert'; value: string}
    | {type: 'modify'; block: ModifyBlock};

const parseMessageParts = (content: string): MessagePart[] =>
{
    const parts: MessagePart[] = [];
    const regex = /\[(INSERTAR|MODIFICAR)\]([\s\S]*?)\[\/\1\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null)
    {
        if (match.index > lastIndex)
            parts.push({type: 'text', value: content.slice(lastIndex, match.index)});

        const tag  = match[1];
        const body = match[2].trim();

        if (tag === 'INSERTAR')
        {
            parts.push({type: 'insert', value: body});
        }
        else
        {
            try
            {
                // Normalize quotes: the AI sometimes uses curly quotes or unescaped chars
                const sanitized = body
                    .replace(/[\u201C\u201D]/g, '"')
                    .replace(/[\u2018\u2019]/g, "'");
                const block: ModifyBlock = JSON.parse(sanitized);
                parts.push({type: 'modify', block});
            }
            catch
            {
                parts.push({type: 'text', value: '_(El bloque de modificación llegó con formato inválido. Puedes pedirle a Legalito que lo intente de nuevo.)_'});
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length)
        parts.push({type: 'text', value: content.slice(lastIndex)});

    return parts.length > 0 ? parts : [{type: 'text', value: content}];
};

const hasConversation = (messages: ChatMessage[]) =>
    messages.length > 1 || (messages.length === 1 && messages[0].content !== WELCOME.content);

interface AiAgentProps
{
    documentContent?: string;
}

const AiAgent = ({documentContent}: AiAgentProps) =>
{
    const {accessToken} = useAuth();
    const firmId = useFirmId();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
    const [savedSession, setSavedSession] = useState<ChatMessage[] | null>(null);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [closing, setClosing] = useState(false);
    const [insertedBlocks,   setInsertedBlocks]   = useState<Set<string>>(new Set());
    const [modifyStates,     setModifyStates]     = useState<Map<string, 'applied' | 'cancelled'>>(new Map());
    const [activeDocContent, setActiveDocContent] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef  = useRef<HTMLTextAreaElement>(null);
    const abortRef  = useRef<AbortController | null>(null);

    useEffect(() =>
    {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    useEffect(() =>
    {
        if (open) inputRef.current?.focus();
    }, [open]);

    // ── Sync document content from the active editor ───────────────────────
    useEffect(() =>
    {
        const onUpdate = (e: Event) =>
            setActiveDocContent((e as CustomEvent<{content: string}>).detail.content);

        const onNotice = (e: Event) =>
        {
            const msg = (e as CustomEvent<{msg: string}>).detail.msg;
            setMessages(prev => [...prev, {role: 'assistant', content: msg}]);
        };

        window.addEventListener('legalito:document-update', onUpdate);
        window.addEventListener('legalito:modify-notice',   onNotice);
        return () =>
        {
            window.removeEventListener('legalito:document-update', onUpdate);
            window.removeEventListener('legalito:modify-notice',   onNotice);
        };
    }, []);

    // ── Open: restaurar sesión guardada si existe ──────────────────────────
    const handleOpen = () =>
    {
        if (savedSession) setMessages(savedSession);
        setOpen(true);
        setClosing(false);
    };

    // ── Intento de cierre: pide acción si hay conversación activa ─────────
    const handleRequestClose = () =>
    {
        if (hasConversation(messages)) {
            setClosing(true);
        } else {
            handleCloseClean();
        }
    };

    const handleSaveAndClose = () =>
    {
        abortRef.current?.abort();
        setSavedSession(messages);
        setOpen(false);
        setClosing(false);
    };

    const handleCloseClean = () =>
    {
        abortRef.current?.abort();
        setSavedSession(null);
        setMessages([WELCOME]);
        setInsertedBlocks(new Set());
        setModifyStates(new Map());
        setOpen(false);
        setClosing(false);
    };

    // ── Nueva conversación (desde dentro del panel) ────────────────────────
    const handleNewChat = () =>
    {
        abortRef.current?.abort();
        setSavedSession(null);
        setMessages([WELCOME]);
        setInsertedBlocks(new Set());
        setModifyStates(new Map());
        setInput('');
        setClosing(false);
    };

    // ── Envío de mensaje ───────────────────────────────────────────────────
    const handleSend = async () =>
    {
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        setMessages(prev => [...prev, {role: 'user', content: text}]);
        setStreaming(true);
        setMessages(prev => [...prev, {role: 'assistant', content: ''}]);

        abortRef.current = new AbortController();

        try {
            const res = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Firm-Id': firmId ?? ''
                },
                body: JSON.stringify({message: text, documentContent: activeDocContent || documentContent}),
                signal: abortRef.current.signal
            });

            if (!res.ok || !res.body) {
                setMessages(prev =>
                {
                    const copy = [...prev];
                    copy[copy.length - 1] = {
                        role: 'assistant',
                        content: 'Error al contactar a Legalito. Intenta de nuevo.'
                    };
                    return copy;
                });
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') break;

                    try {
                        const {text: chunk} = JSON.parse(payload);
                        if (chunk) {
                            setMessages(prev =>
                            {
                                const copy = [...prev];
                                const last = copy[copy.length - 1];
                                copy[copy.length - 1] = {...last, content: last.content + chunk};
                                return copy;
                            });
                        }
                    } catch { /* ignore malformed chunks */
                    }
                }
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setMessages(prev =>
                {
                    const copy = [...prev];
                    copy[copy.length - 1] = {role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo.'};
                    return copy;
                });
            }
        } finally {
            setStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) =>
    {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInsert = (html: string, msgIdx: number, partIdx: number) =>
    {
        const key = `${msgIdx}-${partIdx}`;
        setInsertedBlocks(prev => new Set(prev).add(key));
        window.dispatchEvent(new CustomEvent('legalito:insert', {detail: {html}}));
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '¡Listo! El contenido fue añadido al documento correctamente.'
        }]);
    };

    const handleApplyModify = (block: ModifyBlock, msgIdx: number, partIdx: number) =>
    {
        const key = `${msgIdx}-${partIdx}`;
        setModifyStates(prev => new Map(prev).set(key, 'applied'));
        window.dispatchEvent(new CustomEvent('legalito:modify', {detail: block}));
        setMessages(prev => [...prev, {
            role:    'assistant',
            content: '¡Listo! Los cambios fueron aplicados al documento.',
        }]);
    };

    const handleCancelModify = (msgIdx: number, partIdx: number) =>
    {
        const key = `${msgIdx}-${partIdx}`;
        setModifyStates(prev => new Map(prev).set(key, 'cancelled'));
    };

    return (
        <>
            {/* Floating trigger */}
            <button
                className={`${styles.trigger} ${open ? styles.triggerHidden : ''}`}
                onClick={handleOpen}
                title="Abrir Legalito"
            >
                <Legalito className={styles.triggerIcon}/>
                {savedSession && <span className={styles.sessionDot}/>}
            </button>

            {/* Chat panel */}
            {open && (
                <div className={styles.panel}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatar}>L</div>
                            <div>
                                <span className={styles.name}>Legalito</span>
                                <span className={styles.subtitle}>Asistente jurídico IA</span>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.iconBtn}
                                onClick={handleNewChat}
                                title="Nueva conversación"
                                disabled={!hasConversation(messages)}
                            >
                                <RotateBack/>
                            </button>
                            <button
                                className={styles.iconBtn}
                                onClick={handleSaveAndClose}
                                title="Minimizar"
                            >
                                <ArrowDown/>
                            </button>
                            <button className={styles.closeBtn} onClick={handleRequestClose}>
                                <X/>
                            </button>
                        </div>
                    </div>

                    {/* Prompt de cierre — aparece sobre los mensajes */}
                    {closing && (
                        <div className={styles.closingPrompt}>
                            <p>¿Qué deseas hacer con esta conversación?</p>
                            <div className={styles.closingActions}>
                                <button className={styles.btnSave} onClick={handleSaveAndClose}>
                                    Guardar sesión
                                </button>
                                <button className={styles.btnDiscard} onClick={handleCloseClean}>
                                    <Trash/> Cerrar sin guardar
                                </button>
                            </div>
                            <button className={styles.btnBack} onClick={() => setClosing(false)}>
                                Cancelar
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div className={styles.messages}>
                        {messages.map((msg, i) =>
                        {
                            const isStreamingThis = streaming && i === messages.length - 1 && msg.role === 'assistant';
                            const parts = (!isStreamingThis && msg.role === 'assistant')
                                ? parseMessageParts(msg.content)
                                : [{type: 'text' as const, value: msg.content}];

                            return (
                                <div
                                    key={i}
                                    className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <>
                                            {parts.map((part, j) =>
                                                part.type === 'insert' ? (
                                                    <div key={j} className={styles.insertBlock}>
                                                        <div
                                                            className={styles.insertPreview}
                                                            dangerouslySetInnerHTML={{__html: part.value}}
                                                        />
                                                        <button
                                                            className={`${styles.insertBtn} ${insertedBlocks.has(`${i}-${j}`) ? styles.insertBtnDone : ''}`}
                                                            onClick={() => !insertedBlocks.has(`${i}-${j}`) && handleInsert(part.value, i, j)}
                                                            disabled={insertedBlocks.has(`${i}-${j}`)}
                                                        >
                                                            {insertedBlocks.has(`${i}-${j}`)
                                                                ? <><Check /> Insertado</>
                                                                : <><Plus /> Insertar en documento</>
                                                            }
                                                        </button>
                                                    </div>
                                                ) : part.type === 'modify' ? (
                                                    (() => {
                                                        const key      = `${i}-${j}`;
                                                        const mState   = modifyStates.get(key);
                                                        const applied  = mState === 'applied';
                                                        const cancelled= mState === 'cancelled';
                                                        return (
                                                            <div key={j} className={`${styles.modifyCard} ${applied ? styles.modifyCardApplied : cancelled ? styles.modifyCardCancelled : ''}`}>
                                                                <div className={styles.modifyHeader}>
                                                                    <span className={styles.modifyLabel}>Propuesta de modificación</span>
                                                                </div>
                                                                <p className={styles.modifyDesc}>{part.block.descripcion}</p>
                                                                <div className={styles.modifyPreview} dangerouslySetInnerHTML={{__html: part.block.contenido}} />
                                                                {part.block.reemplazos && part.block.reemplazos.length > 0 && (
                                                                    <ul className={styles.modifyReplacements}>
                                                                        {part.block.reemplazos.map((r, k) => (
                                                                            <li key={k}><span>{r.buscar}</span><span className={styles.modifyArrow}>→</span><span>{r.reemplazar}</span></li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                {!applied && !cancelled ? (
                                                                    <div className={styles.modifyActions}>
                                                                        <button className={styles.modifyApplyBtn} onClick={() => handleApplyModify(part.block, i, j)}>
                                                                            <Check /> Aplicar cambios
                                                                        </button>
                                                                        <button className={styles.modifyCancelBtn} onClick={() => handleCancelModify(i, j)}>
                                                                            Cancelar
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className={styles.modifyStatus}>
                                                                        {applied ? '✓ Cambios aplicados' : '✕ Cancelado'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <span
                                                        key={j}
                                                        dangerouslySetInnerHTML={{__html: renderMarkdown(part.value)}}
                                                    />
                                                )
                                            )}
                                            {isStreamingThis && msg.content === '' && <span className={styles.cursor}/>}
                                        </>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            );
                        })}
                        {streaming && messages[messages.length - 1]?.content !== '' && (
                            <div className={styles.cursorWrap}><span className={styles.cursor}/></div>
                        )}
                        <div ref={bottomRef}/>
                    </div>

                    {/* Input */}
                    <div className={styles.inputRow}>
                        <textarea
                            ref={inputRef}
                            className={styles.input}
                            placeholder="Escribe tu pregunta jurídica..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={streaming || closing}
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={handleSend}
                            disabled={!input.trim() || streaming || closing}
                            title="Enviar"
                        >
                            <Send/>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAgent;