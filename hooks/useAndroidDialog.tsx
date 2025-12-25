import React, { useCallback, useState } from 'react';
import AndroidAlertDialog from '../components/ui/AndroidAlertDialog';

type DialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export function useAndroidDialog() {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const hideDialog = useCallback(() => setDialog(null), []);

  const showDialog = useCallback((opts: DialogOptions) => {
    setDialog(opts);
  }, []);

  const dialogElement = dialog ? (
    <AndroidAlertDialog
      visible={true}
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      cancelLabel={dialog.cancelLabel}
      onConfirm={() => {
        dialog.onConfirm?.();
        hideDialog();
      }}
      onCancel={() => {
        dialog.onCancel?.();
        hideDialog();
      }}
    />
  ) : null;

  return { showDialog, dialogElement, hideDialog };
}
