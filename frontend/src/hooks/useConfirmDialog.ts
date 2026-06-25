import { useCallback, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'error' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const ask = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!loading) {
      setOpen(false);
    }
  }, [loading]);

  const confirm = useCallback(async () => {
    if (!options) return;
    setLoading(true);
    try {
      await options.onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    open,
    loading,
    options,
    ask,
    close,
    confirm,
  };
}
