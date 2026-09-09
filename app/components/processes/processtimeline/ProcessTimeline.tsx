'use client';

import {useEffect, useMemo, useState} from 'react';
import styles from './processtimeline.module.css';
import {useFetch} from '@/hooks/useFetch';
import {usePermissions} from '@/context/PermissionsContext';
import {useConfirm} from '@/hooks/useConfirm';
import {toast} from 'sonner';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import {ArrowDown, ArrowGo, CalendarClock, Edit, Plus, Search, Trash} from '@/app/components/svg';
import type {
    FirmMember,
    PendingAttachment,
    PendingReminder,
    ProcessTimelineComment,
    ProcessTimelineStage,
    StageAdvanceDraft,
    TimelineCommentDraft,
} from '@/app/interfaces/interfaces';
import {
    PROCESS_TIMELINE_ATTACHMENT_TYPE_COLORS,
    PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS,
    TIMELINE_STAGE_COLORS,
    TIMELINE_STAGE_LABELS,
    TIMELINE_STAGE_ORDER,
    TIMELINE_STAGE_STATUS_COLORS,
    TIMELINE_STAGE_STATUS_LABELS,
    TimelineStage,
    type TimelineStageStatus,
} from '@/app/interfaces/enums';
import {uploadAttachment} from '@/lib/attachments';
import AttachmentsPanel from '@/app/components/shared/attachmentspanel/AttachmentsPanel';
import TimelineStageModal from '@/app/components/processes/timelinemodals/TimelineStageModal';
import TimelineCommentModal from '@/app/components/processes/timelinemodals/TimelineCommentModal';
import TimelineReminderList from '@/app/components/processes/timelinemodals/TimelineReminderList';

const STAGE_SEQUENCE = Object.values(TimelineStage);
const TOTAL_STAGES = STAGE_SEQUENCE.length;

const STAGE_HINT: Record<TimelineStage, string> = {
    [TimelineStage.Demanda]:      'Presentación de la demanda.',
    [TimelineStage.Notificacion]: 'Notificación a la contraparte.',
    [TimelineStage.Contestacion]: 'Contestación y excepciones.',
    [TimelineStage.Audiencia]:    'Audiencias del proceso.',
    [TimelineStage.Sentencia]:    'Fallo de instancia.',
    [TimelineStage.Recurso]:      'Recursos ante el superior.',
};

const SKIPPED_TOOLTIP = 'Esta etapa no se registró en la línea de tiempo. El proceso avanzó a una etapa posterior y no es posible retroceder para registrarla.';
const NOT_REACHED_TOOLTIP = 'El proceso todavía no llega a esta etapa.';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

const responsibleName = (responsible: ProcessTimelineComment['responsible']) =>
    responsible?.user ? `${responsible.user.firstName} ${responsible.user.lastName}` : '—';

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || '·';

interface StageView
{
    stage:  TimelineStage;
    order:  number;
    status: TimelineStageStatus;
    row:    ProcessTimelineStage | null;
}

interface ProcessTimelineProps
{
    processId: string;
}

const ProcessTimeline = ({processId}: ProcessTimelineProps) =>
{
    const {can}   = usePermissions();
    const canEdit = can('processes:edit');

    const {data: stages, isLoading, execute: refetch} =
        useFetch<ProcessTimelineStage[]>(`process/${processId}/timeline`, {firmScoped: true});

    // Solo el primer fetch tapa el panel; los refetch tras una mutación se hacen
    // en segundo plano manteniendo la lista visible (useFetch conserva `data`).
    const firstLoad = isLoading && stages == null;

    const {data: members} =
        useFetch<FirmMember[]>('firm/me/members', {firmScoped: true});

    const {execute: createStage}    = useFetch<ProcessTimelineStage & {firstCommentId: string | null}>('', {method: 'POST', immediate: false, firmScoped: true});
    const {execute: deleteStage}    = useFetch<{message: string}>('',     {method: 'DELETE', immediate: false, firmScoped: true});
    const {execute: createComment}  = useFetch<ProcessTimelineComment>('',{method: 'POST',   immediate: false, firmScoped: true});
    const {execute: updateComment}  = useFetch<ProcessTimelineComment>('',{method: 'PATCH',  immediate: false, firmScoped: true});
    const {execute: deleteComment}  = useFetch<{message: string}>('',     {method: 'DELETE', immediate: false, firmScoped: true});
    const {execute: createReminder} = useFetch('', {method: 'POST', immediate: false, firmScoped: true});
    const {execute: uploadDoc}      = useFetch('', {method: 'POST', immediate: false, firmScoped: true, isFormData: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const [searchInput,    setSearchInput]  = useState('');
    const [search,         setSearch]       = useState('');
    const [expandedIds,    setExpandedIds]  = useState<Set<string>>(new Set());
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [commentModal,   setCommentModal] = useState<{stageId: string; comment: ProcessTimelineComment | null} | null>(null);
    const [saving,         setSaving]       = useState(false);

    useEffect(() =>
    {
        const timer = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const allStages = useMemo(() => stages ?? [], [stages]);
    const latestId  = allStages[allStages.length - 1]?.id;

    // La etapa actual arranca expandida; si el usuario la colapsa, se respeta.
    useEffect(() =>
    {
        if (latestId) setExpandedIds(prev => prev.has(latestId) ? prev : new Set(prev).add(latestId));
    }, [latestId]);

    const activeMembers = useMemo(
        () => (members ?? []).filter(member => member.status === 'ACTIVE' && member.user),
        [members],
    );
    const memberEmails = useMemo(
        () => activeMembers.map(member => ({email: member.user!.email, name: `${member.user!.firstName} ${member.user!.lastName}`})),
        [activeMembers],
    );
    const memberRoleByUserId = useMemo(() =>
    {
        const map: Record<string, string> = {};
        for (const member of members ?? [])
            if (member.userId && member.firmRole?.name) map[member.userId] = member.firmRole.name;
        return map;
    }, [members]);

    const latest      = allStages[allStages.length - 1];
    const currentOrder = latest ? TIMELINE_STAGE_ORDER[latest.stage] : 0;
    const latestHasComment = (latest?.comments?.length ?? 0) > 0;
    const canAdvance  = currentOrder < TOTAL_STAGES;

    const allowedStages = allStages.length === 0
        ? STAGE_SEQUENCE
        : STAGE_SEQUENCE.filter(stage => TIMELINE_STAGE_ORDER[stage] > currentOrder);

    // Las 6 etapas siempre presentes, cada una con su estado calculado.
    const stageViews = useMemo<StageView[]>(() =>
        STAGE_SEQUENCE.map(stage =>
        {
            const order = TIMELINE_STAGE_ORDER[stage];
            const row   = allStages.find(candidate => candidate.stage === stage) ?? null;

            let status: TimelineStageStatus;
            if (row && row.id === latest?.id) status = 'current';
            else if (row)                     status = 'done';
            else if (order < currentOrder)    status = 'skipped';
            else                              status = 'notReached';

            return {stage, order, status, row};
        }),
        [allStages, latest, currentOrder],
    );

    // Durante la búsqueda solo se listan las etapas registradas con comentarios que coinciden.
    const searchMatches = useMemo<StageView[]>(() =>
    {
        if (!search) return [];
        return stageViews
            .filter(view => view.row)
            .map(view => ({
                ...view,
                row: {...view.row!, comments: (view.row!.comments ?? []).filter(comment => comment.body.toLowerCase().includes(search))},
            }))
            .filter(view =>
                TIMELINE_STAGE_LABELS[view.stage].toLowerCase().includes(search)
                || (view.row!.microStageLabel ?? '').toLowerCase().includes(search)
                || (view.row!.comments?.length ?? 0) > 0,
            );
    }, [stageViews, search]);

    const toggleExpanded = (id: string) =>
        setExpandedIds(prev =>
        {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const handleSaveStage = async (stage: TimelineStage, microStageLabel: string, advance: StageAdvanceDraft | null) =>
    {
        setSaving(true);

        const firstComment = advance
            ? {body: advance.body.trim() || 'Documento adjunto en el avance de etapa.'}
            : undefined;

        const result = await createStage(
            {body: {stage, microStageLabel: microStageLabel.trim() || undefined, firstComment}},
            `process/${processId}/timeline`,
        );
        if (!result) { setSaving(false); return; }

        let uploadsFailed = 0;
        if (advance && advance.attachments.length > 0 && result.firstCommentId)
        {
            const uploads = await Promise.all(advance.attachments.map(attachment =>
                uploadAttachment(uploadDoc, `process/${processId}/timeline/${result.id}/comments/${result.firstCommentId}/attachments`, attachment.file, attachment.type)
                    .catch(() => false),
            ));
            uploadsFailed = uploads.filter(ok => !ok).length;
        }

        setSaving(false);
        setStageModalOpen(false);
        setExpandedIds(prev => new Set(prev).add(result.id));
        refetch();

        if (uploadsFailed > 0)
            toast.error(`La etapa se registró, pero ${uploadsFailed} adjunto(s) fallaron. Reintentá adjuntarlos desde el comentario.`);
        else
            toast.success(advance ? 'Etapa registrada con su primer comentario.' : 'Etapa registrada.');
    };

    const handleDeleteStage = async (row: ProcessTimelineStage) =>
    {
        if (!await confirm({
            title:        'Eliminar etapa',
            message:      `¿Eliminar la etapa "${TIMELINE_STAGE_LABELS[row.stage]}"? Se quitan también sus comentarios, adjuntos y recordatorios. El proceso vuelve a la etapa registrada anterior.`,
            confirmLabel: 'Eliminar',
        })) return;

        const result = await deleteStage({}, `process/${processId}/timeline/${row.id}`);
        if (!result) return;
        toast.success('Etapa eliminada.');
        refetch();
    };

    const handleSaveComment = async (draft: TimelineCommentDraft, pendingAttachments: PendingAttachment[], pendingReminders: PendingReminder[]) =>
    {
        if (!commentModal) return;
        setSaving(true);

        const {stageId, comment} = commentModal;
        const body = {
            body:          draft.body.trim(),
            commentDate:   draft.isFutureEvent && draft.eventDate ? new Date(draft.eventDate).toISOString() : null,
            responsibleId: draft.responsibleId || undefined,
        };

        if (comment)
        {
            const result = await updateComment({body}, `process/${processId}/timeline/${stageId}/comments/${comment.id}`);
            setSaving(false);
            if (!result) return;
            toast.success('Comentario actualizado.');
            setCommentModal(null);
            refetch();
            return;
        }

        const created = await createComment({body}, `process/${processId}/timeline/${stageId}/comments`);
        if (!created) { setSaving(false); return; }

        for (const reminder of pendingReminders)
            await createReminder({body: reminder}, `process/${processId}/timeline/${stageId}/comments/${created.id}/reminders`);

        let uploadsFailed = 0;
        if (pendingAttachments.length > 0)
        {
            const uploads = await Promise.all(pendingAttachments.map(attachment =>
                uploadAttachment(uploadDoc, `process/${processId}/timeline/${stageId}/comments/${created.id}/attachments`, attachment.file, attachment.type)
                    .catch(() => false),
            ));
            uploadsFailed = uploads.filter(ok => !ok).length;
        }

        setSaving(false);
        setCommentModal(null);
        refetch();

        if (uploadsFailed > 0)
            toast.error(`El comentario se guardó, pero ${uploadsFailed} de ${pendingAttachments.length} adjunto(s) fallaron. Reintentá adjuntarlos desde el comentario (revisá la consola para el detalle).`);
        else
            toast.success('Comentario agregado.');
    };

    const handleDeleteComment = async (stageId: string, comment: ProcessTimelineComment) =>
    {
        if (!await confirm({title: 'Eliminar comentario', message: '¿Eliminar este comentario y sus adjuntos/recordatorios?', confirmLabel: 'Eliminar'})) return;
        const result = await deleteComment({}, `process/${processId}/timeline/${stageId}/comments/${comment.id}`);
        if (!result) return;
        toast.success('Comentario eliminado.');
        refetch();
    };

    const renderComment = (stageId: string, comment: ProcessTimelineComment) =>
    {
        const authorName = comment.creator
            ? `${comment.creator.firstName} ${comment.creator.lastName}`
            : 'Miembro del despacho';
        const authorRole = comment.creator ? memberRoleByUserId[comment.creator.id] : undefined;
        const hasEventDate = comment.commentDate != null;

        return (
            <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                    <span className={styles.avatar}>{initials(authorName)}</span>
                    <div className={styles.commentAuthor}>
                        <span className={styles.authorLine}>
                            <span className={styles.authorName}>{authorName}</span>
                            {authorRole && <span className={styles.roleChip}>{authorRole}</span>}
                        </span>
                        <span className={styles.commentDate}>{fmtDateTime(comment.createdAt)}</span>
                    </div>
                    <span className={styles.spacer} />
                    {canEdit && (
                        <div className={styles.commentHeaderActions}>
                            <button className={styles.iconBtn} title="Editar comentario" onClick={() => setCommentModal({stageId, comment})}>
                                <Edit />
                            </button>
                            <button className={`${styles.iconBtn} ${styles.danger}`} title="Eliminar comentario" onClick={() => handleDeleteComment(stageId, comment)}>
                                <Trash />
                            </button>
                        </div>
                    )}
                </div>

                <p className={styles.commentBody}>{comment.body}</p>

                {comment.commentDate && (
                    <div className={styles.commentMeta}>
                        <strong>Evento:</strong> {fmtDateTime(comment.commentDate)}
                    </div>
                )}

                {comment.responsible?.user && (
                    <div className={styles.commentMeta}>
                        <strong>Responsable:</strong> {responsibleName(comment.responsible)}
                    </div>
                )}

                <AttachmentsPanel
                    variant="inline"
                    apiBasePath={`process/${processId}/timeline/${stageId}/comments/${comment.id}/attachments`}
                    typeOptions={Object.entries(PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS).map(([value, label]) => ({value, label}))}
                    typeColors={PROCESS_TIMELINE_ATTACHMENT_TYPE_COLORS}
                    items={comment.attachments ?? []}
                    onChanged={refetch}
                />

                <TimelineReminderList
                    apiBasePath={`process/${processId}/timeline/${stageId}/comments/${comment.id}/reminders`}
                    reminders={comment.reminders ?? []}
                    onChanged={refetch}
                    memberEmails={memberEmails}
                    defaultEmail={comment.responsible?.user?.email ?? ''}
                    hasEventDate={hasEventDate}
                />
            </div>
        );
    };

    // Etapa registrada (superada o actual): tarjeta completa con comentarios.
    const renderStageCard = ({stage, order, status, row}: StageView) =>
    {
        if (!row) return null;

        const isCurrent   = status === 'current';
        const statusColor  = TIMELINE_STAGE_STATUS_COLORS[status];
        const stageColor   = TIMELINE_STAGE_COLORS[stage];
        const expanded     = expandedIds.has(row.id);
        const comments     = row.comments ?? [];

        return (
            <div key={row.id} className={styles.stageRow}>
                <span className={`${styles.node} ${isCurrent ? styles.nodeCurrent : ''}`} style={{background: statusColor.color}} />

                <div className={`${styles.stageCard} ${isCurrent ? styles.stageCardCurrent : ''}`}>
                    <div className={styles.stageHeader}>
                        <span className={styles.stageBadge} style={{backgroundColor: stageColor.bg, color: stageColor.color}}>
                            {order}. {TIMELINE_STAGE_LABELS[stage]}
                        </span>
                        {row.microStageLabel && <span className={styles.microTag}>{row.microStageLabel}</span>}
                        <span className={styles.currentPill} style={{backgroundColor: statusColor.bg, color: statusColor.color}}>
                            {TIMELINE_STAGE_STATUS_LABELS[status]}
                        </span>

                        <span className={styles.spacer} />

                        {isCurrent && canEdit && (
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteStage(row)}>
                                <Trash /> Eliminar etapa
                            </button>
                        )}
                        <button className={styles.expandBtn} onClick={() => toggleExpanded(row.id)}>
                            {expanded ? <ArrowDown /> : <ArrowGo />}
                        </button>
                    </div>

                    {!expanded && (
                        <p className={styles.stageMeta}>{comments.length} comentario{comments.length === 1 ? '' : 's'}</p>
                    )}

                    {expanded && (
                        <div className={styles.commentList}>
                            {comments.length === 0
                                ? <p className={styles.stageMeta}>Sin comentarios en esta etapa.</p>
                                : comments.map(comment => renderComment(row.id, comment))}

                            {canEdit && (
                                <button className={styles.addCommentBtn} onClick={() => setCommentModal({stageId: row.id, comment: null})}>
                                    <Plus /> Agregar comentario
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Etapa sin registro (omitida o no alcanzada): fila de una línea, no interactiva.
    const renderStagePlaceholder = ({stage, order, status}: StageView) =>
    {
        const statusColor = TIMELINE_STAGE_STATUS_COLORS[status];
        const tooltip = status === 'skipped' ? SKIPPED_TOOLTIP : NOT_REACHED_TOOLTIP;

        return (
            <div key={stage} className={`${styles.stageRow} ${styles.stageRowMuted}`}>
                <span className={styles.nodeMuted} style={{borderColor: statusColor.color}} />

                <div className={styles.placeholderCard} title={tooltip}>
                    <span className={styles.placeholderTitle}>{order}. {TIMELINE_STAGE_LABELS[stage]}</span>
                    <span className={styles.placeholderHint}>{STAGE_HINT[stage]}</span>
                    <span className={styles.spacer} />
                    <span className={styles.mutedPill} style={{backgroundColor: statusColor.bg, color: statusColor.color}}>
                        {TIMELINE_STAGE_STATUS_LABELS[status]}
                    </span>
                </div>
            </div>
        );
    };

    const renderStageView = (view: StageView) =>
        (view.status === 'current' || view.status === 'done')
            ? renderStageCard(view)
            : renderStagePlaceholder(view);

    const currentLabel = latest ? TIMELINE_STAGE_LABELS[latest.stage] : null;

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}><CalendarClock /></div>
                    <div>
                        <h3 className={styles.headerTitle}>Línea de tiempo del proceso</h3>
                        <p className={styles.headerSub}>Flujo de etapas jurídicas y sus comentarios / observaciones.</p>
                        {currentOrder > 0 && (
                            <div className={styles.progress}>
                                <span className={styles.progressBadge}>Etapa {currentOrder} de {TOTAL_STAGES} · {currentLabel}</span>
                                <span className={styles.progressBar}>
                                    {STAGE_SEQUENCE.map(stage => (
                                        <span
                                            key={stage}
                                            className={styles.progressSeg}
                                            data-filled={TIMELINE_STAGE_ORDER[stage] <= currentOrder}
                                        />
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {expandedIds.size > 0 && (
                        <button className={styles.ghostBtn} onClick={() => setExpandedIds(new Set())}>Contraer todo</button>
                    )}
                    {canEdit && allStages.length > 0 && canAdvance && (
                        <div className={styles.advanceWrap}>
                            <button className={styles.primaryBtn} onClick={() => setStageModalOpen(true)} disabled={!latestHasComment}>
                                <Plus /> Siguiente etapa
                            </button>
                            {!latestHasComment && (
                                <span className={styles.hint}>Agregá un comentario a la etapa actual para avanzar</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <Search />
                <input
                    className={styles.searchInput}
                    placeholder="Buscar en comentarios..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
            </div>

            {firstLoad ? (
                <p className={styles.empty}>Cargando línea de tiempo...</p>
            ) : allStages.length === 0 ? (
                <div className={styles.emptyBox}>
                    <p>Aún no hay etapas registradas en este proceso.</p>
                    {canEdit && (
                        <button className={styles.primaryBtn} onClick={() => setStageModalOpen(true)}>
                            <Plus /> Registrar la primera etapa
                        </button>
                    )}
                </div>
            ) : search ? (
                searchMatches.length === 0
                    ? <p className={styles.empty}>No hay comentarios que coincidan con la búsqueda.</p>
                    : <div className={styles.timeline}>{searchMatches.map(renderStageCard)}</div>
            ) : (
                <div className={styles.timeline}>
                    {stageViews.map(renderStageView)}
                </div>
            )}

            <TimelineStageModal
                open={stageModalOpen}
                saving={saving}
                allowedStages={allowedStages}
                onClose={() => setStageModalOpen(false)}
                onSave={handleSaveStage}
            />

            <TimelineCommentModal
                open={!!commentModal}
                saving={saving}
                comment={commentModal?.comment ?? null}
                members={activeMembers}
                memberEmails={memberEmails}
                onClose={() => setCommentModal(null)}
                onSave={handleSaveComment}
            />

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default ProcessTimeline;
