// PLAN 1.6 — Excel viewer. Mounts Univer (toolbar, formula bar, grid, sheet tabs)
// onto a div and loads the workbook snapshot.

import { useEffect, useRef } from 'react';
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import type { ExcelFileData } from '../../../types/file';
import { readClayRamp } from '../../../styles/clayRamp';
import styles from './ExcelViewer.module.css';

interface Props {
  data: ExcelFileData; // Univer snapshot from electron/lib/excel-converter.ts
  filePath: string;    // Used by parent as React key — switching files remounts this component
}

export function ExcelViewer({ data }: Props): JSX.Element {
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

    univerAPI.createWorkbook(data.snapshot);
    return () => univerAPI.dispose();
  // Snapshot read once at mount; parent's key={filePath} forces remount on file change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.container} />;
}
