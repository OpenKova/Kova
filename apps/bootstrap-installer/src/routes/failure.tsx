import { useStore } from '@nanostores/react'
import { AlertCircle, FileText, RefreshCw } from 'lucide-react'

import { Button } from '../components/button'
import { $logPath, $mode, type BootstrapStateModel, openLogDir, startInstall, startUpdate } from '../store'

interface FailureProps {
  bootstrap: BootstrapStateModel
}

export default function Failure({ bootstrap }: FailureProps) {
  const logPath = useStore($logPath)
  const isUpdate = useStore($mode) === 'update'

  return (
    <div className="kova-fade-in flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 py-10">
      <section className="w-full max-w-xl">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
              {isUpdate ? 'Update interrupted' : 'Setup interrupted'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              {isUpdate ? 'Kova could not finish updating.' : 'Kova could not finish setup.'}
            </h1>
            <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
              {bootstrap.error ?? (isUpdate ? 'Something went wrong during the update.' : 'Something went wrong during setup.')}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          <Button className="min-h-10 px-4" onClick={() => void (isUpdate ? startUpdate() : startInstall())}>
            <RefreshCw />
            {isUpdate ? 'Retry update' : 'Retry setup'}
          </Button>
          <Button className="min-h-10 px-4" onClick={() => void openLogDir()} variant="outline">
            <FileText />
            Open logs
          </Button>
        </div>

        {logPath && (
          <p className="mt-4 break-all text-xs text-muted-foreground">
            Log file: <code className="font-mono">{logPath}</code>
          </p>
        )}
      </section>
    </div>
  )
}
