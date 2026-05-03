// PLAN 1.6 — Excel viewer. Mounts Univer (toolbar, formula bar, grid, sheet
// tabs) onto a div and loads the workbook snapshot.
// PLAN 1.8 — Subscribes to mutation commands → markDirty, registers the live
// Univer snapshot for the save path.

import { useEffect, useRef } from 'react';
import { createUniver, defaultTheme, LocaleType, mergeLocales, CommandType } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import type { ExcelFileData } from '../../../types/file';
import { readClayRamp } from '../../../styles/clayRamp';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { register, unregister } from '../../../lib/excelLiveSnapshot';
import styles from './ExcelViewer.module.css';

interface Props {
  data: ExcelFileData; // Univer snapshot from electron/lib/excel-converter.ts
  filePath: string;    // Used by parent as React key — switching files remounts this component
}

export function ExcelViewer({ data, filePath }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      // Required: Univer v0.21+ throws on init without a locales map.
      locales: { [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS) },
      theme: { ...defaultTheme, primary: readClayRamp() },
      darkMode: true,
      presets: [UniverSheetsCorePreset({ container: containerRef.current })],
    });

    const fwb = univerAPI.createWorkbook(data.snapshot);
    register(filePath, () => fwb.save() as unknown as Record<string, unknown>);

    // MUTATION = changes to saved state (typing, paste, fill, undo, merges).
    // OPERATION = transient UI state (selection, scroll) — skipped.
    const sub = univerAPI.addEvent(univerAPI.Event.CommandExecuted, (event) => {
      if (event.type === CommandType.MUTATION) {
        useWorkspaceStore.getState().markDirty(filePath);
      }
    });

    return () => {
      sub.dispose();
      unregister(filePath);
      univerAPI.dispose();
    };
  // Snapshot read once at mount; parent's key={filePath} forces remount on file change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.container} />;
}
