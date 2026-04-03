'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Scale} from '@/app/components/svg';

const CivilBranchPage = () => (
    <BranchOverview
        branchSlug="civil"
        branchTitle="Derecho Civil"
        branchDescription="Gestiona y genera contratos, poderes, testamentos y documentos del área del derecho civil colombiano."
        branchIcon={<Scale />}
        documentTypes={[
            {title: 'Contratos de Compraventa',             link: '/dashboard/generator/civil/compraventa'},
            {title: 'Contratos de Arrendamiento',           link: '/dashboard/generator/civil/rentalcontract'},
            {title: 'Contratos de Prestación de Servicios', link: '/dashboard/generator/civil/servicios'},
            {title: 'Contratos de Comodato',                link: '/dashboard/generator/civil/comodato'},
            {title: 'Poderes Generales y Especiales',       link: '/dashboard/generator/civil/poderes'},
            {title: 'Testamentos',                          link: '/dashboard/generator/civil/testamentos'},
            {title: 'Capitulaciones Matrimoniales',         link: '/dashboard/generator/civil/capitulaciones'},
        ]}
    />
);

export default CivilBranchPage;
