'use client';

import {useState, useCallback} from 'react';

interface ConfirmOptions
{
    title:        string;
    message:      string;
    confirmLabel?: string;
    danger?:      boolean;
}

interface ConfirmState extends ConfirmOptions
{
    resolve: (value: boolean) => void;
}

export const useConfirm = () =>
{
    const [state, setState] = useState<ConfirmState | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> =>
    {
        return new Promise(resolve =>
        {
            setState({...options, resolve});
        });
    }, []);

    const handleConfirm = useCallback(() =>
    {
        state?.resolve(true);
        setState(null);
    }, [state]);

    const handleCancel = useCallback(() =>
    {
        state?.resolve(false);
        setState(null);
    }, [state]);

    return {confirm, confirmState: state, handleConfirm, handleCancel};
};
