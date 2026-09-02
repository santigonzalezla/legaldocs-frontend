'use client';

import {useParams} from 'next/navigation';
import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';
import {PermissionGuard} from '@/app/components/auth/PermissionGuard';

const Page = () =>
{
    const {branch} = useParams<{branch: string}>();
    return <BranchOverview key={branch} branchSlug={branch} />;
};

const PageGuarded = () => (
    <PermissionGuard permission="documents:create">
        <Page/>
    </PermissionGuard>
);

export default PageGuarded;
