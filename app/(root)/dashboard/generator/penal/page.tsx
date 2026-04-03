'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Shield} from '@/app/components/svg';

const PenalBranchPage = () => (
    <BranchOverview
        branchSlug="penal"
        branchTitle="Derecho Penal"
        branchDescription="Genera denuncias, alegatos, solicitudes de preclusión y documentos de actuación penal bajo el marco normativo colombiano."
        branchIcon={<Shield />}
        documentTypes={[
            {title: 'Denuncias Penales',          link: '/dashboard/generator/penal/denuncias'},
            {title: 'Solicitudes de Preclusión',  link: '/dashboard/generator/penal/preclusion'},
            {title: 'Alegatos de Apertura',       link: '/dashboard/generator/penal/apertura'},
            {title: 'Alegatos de Conclusión',     link: '/dashboard/generator/penal/conclusion'},
            {title: 'Recursos Penales',           link: '/dashboard/generator/penal/recursos'},
        ]}
    />
);

export default PenalBranchPage;
