'use client';

import formStyles from '@/app/components/clients/createclientmodal/createclientmodal.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {FirmMember} from '@/app/interfaces/interfaces';
import {CLIENT_REGIME_TYPE_LABELS, ClientRegimeType} from '@/app/interfaces/enums';

export interface ClientExtraFieldsValue
{
    address: string;
    regimeType: string;
    sector: string;
    isBusinessGroup: boolean;
    responsiblePartnerId: string;
}

interface ClientExtraFieldsProps
{
    value:        ClientExtraFieldsValue;
    onChange:     (field: keyof ClientExtraFieldsValue, value: string | boolean) => void;
    showAddress?: boolean;
}

const partnerName = (member: FirmMember) =>
    member.user ? `${member.user.firstName} ${member.user.lastName}` : (member.inviteEmail ?? 'Miembro');

const ClientExtraFields = ({value, onChange, showAddress = true}: ClientExtraFieldsProps) =>
{
    const {data: partners} = useFetch<FirmMember[]>('firm/me/members?isPartner=true', {firmScoped: true});

    return (
        <>
            {showAddress && (
                <div className={formStyles.formGroup}>
                    <label>Dirección</label>
                    <input
                        className={formStyles.input}
                        placeholder="Calle 123 # 45-67"
                        value={value.address}
                        onChange={event => onChange('address', event.target.value)}
                    />
                </div>
            )}

            <div className={formStyles.row}>
                <div className={formStyles.formGroup}>
                    <label>Tipo de régimen</label>
                    <select
                        className={formStyles.select}
                        value={value.regimeType}
                        onChange={event => onChange('regimeType', event.target.value)}
                    >
                        <option value="">Sin especificar</option>
                        {Object.values(ClientRegimeType).map(regime => (
                            <option key={regime} value={regime}>{CLIENT_REGIME_TYPE_LABELS[regime]}</option>
                        ))}
                    </select>
                </div>
                <div className={formStyles.formGroup}>
                    <label>Sector</label>
                    <input
                        className={formStyles.input}
                        placeholder="Construcción"
                        value={value.sector}
                        onChange={event => onChange('sector', event.target.value)}
                    />
                </div>
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
                        <option key={member.id} value={member.id}>{partnerName(member)}</option>
                    ))}
                </select>
            </div>

            <label className={formStyles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={value.isBusinessGroup}
                    onChange={event => onChange('isBusinessGroup', event.target.checked)}
                />
                <span>Pertenece a un grupo empresarial</span>
            </label>
        </>
    );
};

export default ClientExtraFields;
