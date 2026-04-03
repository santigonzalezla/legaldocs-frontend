'use client';

import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {Buildings} from '@/app/components/svg';

const ComercialBranchPage = () => (
    <BranchOverview
        branchSlug="comercial"
        branchTitle="Derecho Comercial"
        branchDescription="Genera actas, contratos mercantiles y documentos para constitución de sociedades bajo la normativa comercial colombiana."
        branchIcon={<Buildings />}
        documentTypes={[
            {title: 'Constitución de SAS',       link: '/dashboard/generator/comercial/sas'},
            {title: 'Constitución de Ltda',      link: '/dashboard/generator/comercial/ltda'},
            {title: 'Contratos Comerciales',     link: '/dashboard/generator/comercial/contratos'},
            {title: 'Contratos de Distribución', link: '/dashboard/generator/comercial/distribucion'},
            {title: 'Contratos de Franquicia',   link: '/dashboard/generator/comercial/franquicia'},
            {title: 'Actas de Asamblea/Junta',   link: '/dashboard/generator/comercial/actas'},
        ]}
    />
);

export default ComercialBranchPage;
