'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Building} from '@/app/components/svg';

const AdministrativoBranchPage = () => (
    <BranchOverview
        branchSlug="administrativo"
        branchTitle="Derecho Administrativo"
        branchDescription="Redacta derechos de petición, tutelas, acciones populares y recursos ante entidades públicas colombianas."
        branchIcon={<Building />}
        documentTypes={[
            {title: 'Derechos de Petición',               link: '/dashboard/generator/administrative/rightrequest'},
            {title: 'Recursos de Reposición',             link: '/dashboard/generator/administrative/reposicion'},
            {title: 'Recursos de Apelación Administrativa', link: '/dashboard/generator/administrative/apelacion'},
            {title: 'Acciones de Tutela',                 link: '/dashboard/generator/administrative/tutela'},
            {title: 'Acciones Populares',                 link: '/dashboard/generator/administrative/populares'},
            {title: 'Acciones de Cumplimiento',           link: '/dashboard/generator/administrative/cumplimiento'},
        ]}
    />
);

export default AdministrativoBranchPage;
