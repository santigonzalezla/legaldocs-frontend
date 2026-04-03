'use client';

import {useParams} from 'next/navigation';
import BranchOverview from '@/app/components/generator/branchoverview/BranchOverview';

const Page = () =>
{
    const {branch} = useParams<{branch: string}>();
    return <BranchOverview key={branch} branchSlug={branch} />;
};

export default Page;
