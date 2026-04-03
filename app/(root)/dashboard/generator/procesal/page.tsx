'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Hammer} from '@/app/components/svg';

const ProcesalBranchPage = () => (
    <BranchOverview
        branchSlug="procesal"
        branchTitle="Derecho Procesal"
        branchDescription="Genera demandas, recursos de apelación, casación y actuaciones procesales conforme al ordenamiento jurídico colombiano."
        branchIcon={<Hammer />}
        documentTypes={[
            {title: 'Demandas Civiles',          link: '/dashboard/generator/procesal/demandas-civiles'},
            {title: 'Demandas Laborales',        link: '/dashboard/generator/procesal/demandas-laborales'},
            {title: 'Demandas Penales',          link: '/dashboard/generator/procesal/demandas-penales'},
            {title: 'Contestaciones de Demanda', link: '/dashboard/generator/procesal/contestaciones'},
            {title: 'Recursos de Apelación',     link: '/dashboard/generator/procesal/apelacion'},
            {title: 'Recursos de Casación',      link: '/dashboard/generator/procesal/casacion'},
            {title: 'Incidentes Procesales',     link: '/dashboard/generator/procesal/incidentes'},
            {title: 'Alegatos de Conclusión',    link: '/dashboard/generator/procesal/alegatos'},
        ]}
    />
);

export default ProcesalBranchPage;
