import { useEffect, useRef } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { saveDraft, loadDraft, clearDraft } from '../utils/form-draft';

export function hasDraftContent(draft: Record<string, unknown>): boolean {
  const text = (draft.name ?? draft.title ?? draft.description) as string | undefined;
  return Boolean(typeof text === 'string' && text.trim().length > 0);
}

export function useFormDraft<T extends FieldValues>(
  form: UseFormReturn<T>,
  draftKey: string,
  isCreateMode: boolean,
) {
  const { watch, reset, getValues } = form;
  const isCreateModeRef = useRef(isCreateMode);
  isCreateModeRef.current = isCreateMode;
  const latestValuesRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const subscription = watch((values) => {
      const record = values as Record<string, unknown>;
      latestValuesRef.current = record;
      if (isCreateModeRef.current && hasDraftContent(record)) {
        void saveDraft(draftKey, record);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, draftKey]);

  const restoreFormDraft = async (defaults: T): Promise<boolean> => {
    const draft = await loadDraft<T>(draftKey);
    if (draft && hasDraftContent(draft as Record<string, unknown>)) {
      reset({ ...defaults, ...draft } as T);
      latestValuesRef.current = draft as Record<string, unknown>;
      return true;
    }
    return false;
  };

  const persistFormDraft = async () => {
    const values = getValues() as Record<string, unknown>;
    const record = hasDraftContent(values) ? values : latestValuesRef.current;
    if (hasDraftContent(record)) {
      await saveDraft(draftKey, record);
    }
  };

  const clearFormDraft = async () => {
    latestValuesRef.current = {};
    await clearDraft(draftKey);
  };

  return { clearFormDraft, restoreFormDraft, persistFormDraft };
}
