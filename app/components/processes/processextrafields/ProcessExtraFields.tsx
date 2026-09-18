'use client';

import formStyles from '@/app/components/processes/createprocessmodal/createprocessmodal.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {FirmMember} from '@/app/interfaces/interfaces';
import {PROCESS_BILLING_TYPE_LABELS, ProcessBillingType} from '@/app/interfaces/enums';

export interface ProcessExtraFieldsValue
{
    billingType:           string;
    responsiblePartnerId:  string;
    originatorId:          string;
    billingResponsibleId:  string;
    assignedTo:            string;
    isProBono:             boolean;
    hasPartialPayment:     boolean;
}

interface ProcessExtraFieldsProps
{
    value:    ProcessExtraFieldsValue;
    onChange: (field: keyof ProcessExtraFieldsValue, value: string | boolean) => void;
}

const memberName = (member: FirmMember) =>
    member.user ? `${member.user.firstName} ${member.user.lastName}` : (member.inviteEmail ?? 'Miembro');

const ProcessExtraFields = ({value, onChange}: ProcessExtraFieldsProps) =>
{
    const {data: partners} = useFetch<FirmMember[]>('process/member-options?isPartner=true', {firmScoped: true});
    const {data: members}  = useFetch<FirmMember[]>('process/member-options', {firmScoped: true});

    const assignableMembers = (members ?? []).filter(member => member.userId);

    return (
        <>
            <div className={formStyles.row}>
                <div className={formStyles.formGroup}>
                    <label>Tipo de cobro</label>
                    <select
                        className={formStyles.select}
                        value={value.billingType}
                        onChange={event => onChange('billingType', event.target.value)}
                    >
                        <option value="">Sin especificar</option>
                        {Object.values(ProcessBillingType).map(billingType => (
                            <option key={billingType} value={billingType}>{PROCESS_BILLING_TYPE_LABELS[billingType]}</option>
                        ))}
                    </select>
                </div>
                <div className={formStyles.formGroup}>
                    <label>Socio responsable</label>
                    <select
                        className={formStyles.select}
                        value={value.responsiblePartnerId}
                        onChange={event => onChange('responsiblePartnerId', event.target.value)}
                    >
                        <option value="">Sin asignar</option>
                        {(partners ?? []).map(member => (
                            <option key={member.id} value={member.id}>{memberName(member)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={formStyles.row}>
                <div className={formStyles.formGroup}>
                    <label>Originador</label>
                    <select
                        className={formStyles.select}
                        value={value.originatorId}
                        onChange={event => onChange('originatorId', event.target.value)}
                    >
                        <option value="">Sin asignar</option>
                        {(partners ?? []).map(member => (
                            <option key={member.id} value={member.id}>{memberName(member)}</option>
                        ))}
                    </select>
                </div>
                <div className={formStyles.formGroup}>
                    <label>Responsable de facturación</label>
                    <select
                        className={formStyles.select}
                        value={value.billingResponsibleId}
                        onChange={event => onChange('billingResponsibleId', event.target.value)}
                    >
                        <option value="">Sin asignar</option>
                        {(partners ?? []).map(member => (
                            <option key={member.id} value={member.id}>{memberName(member)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={formStyles.formGroup}>
                <label>Abogado asignado</label>
                <select
                    className={formStyles.select}
                    value={value.assignedTo}
                    onChange={event => onChange('assignedTo', event.target.value)}
                >
                    <option value="">Sin asignar</option>
                    {assignableMembers.map(member => (
                        <option key={member.id} value={member.userId as string}>{memberName(member)}</option>
                    ))}
                </select>
            </div>

            <label className={formStyles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={value.isProBono}
                    onChange={event => onChange('isProBono', event.target.checked)}
                />
                <span>Proceso pro bono</span>
            </label>

            <div className={formStyles.formGroup}>
                <label className={formStyles.checkboxRow}>
                    <input
                        type="checkbox"
                        checked={value.hasPartialPayment}
                        onChange={event => onChange('hasPartialPayment', event.target.checked)}
                    />
                    <span>Ya se realizó un cobro parcial</span>
                </label>
                {value.billingType && value.billingType !== ProcessBillingType.Fixed && (
                    <p className={formStyles.hint}>Aplica principalmente cuando el cobro es por monto fijo.</p>
                )}
            </div>
        </>
    );
};

export default ProcessExtraFields;
