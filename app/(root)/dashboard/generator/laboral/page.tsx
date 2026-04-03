'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Users} from '@/app/components/svg';

const LaboralBranchPage = () => (
    <BranchOverview
        branchSlug="laboral"
        branchTitle="Derecho Laboral"
        branchDescription="Crea contratos de trabajo, reglamentos, acuerdos de confidencialidad y documentos del área laboral colombiana."
        branchIcon={<Users />}
        documentTypes={[
            {title: 'Contratos de Trabajo',               link: '/dashboard/generator/laboral/contratos'},
            {title: 'Contratos de Prestación de Servicios', link: '/dashboard/generator/laboral/servicios'},
            {title: 'Reglamentos Internos',               link: '/dashboard/generator/laboral/reglamentos'},
            {title: 'Acuerdos de Confidencialidad',       link: '/dashboard/generator/laboral/confidencialidad'},
            {title: 'Terminaciones de Contrato',          link: '/dashboard/generator/laboral/terminaciones'},
        ]}
    />
);

export default LaboralBranchPage;
