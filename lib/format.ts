export const formatRelativeTime = (value: string | null): string =>
{
    if (!value) return 'sin datos';

    const diffMs = Date.now() - new Date(value).getTime();
    if (Number.isNaN(diffMs)) return 'sin datos';

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1)  return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;

    const days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? 'hace 1 día' : `hace ${days} días`;

    const months = Math.floor(days / 30);
    return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
};
