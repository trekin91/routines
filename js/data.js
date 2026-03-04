// === Data Import / Export ===

import { exportState, importState } from './state.js';

export function downloadExport() {
  const json = exportState();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mesroutines-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerImport() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('Aucun fichier sélectionné'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          importState(ev.target.result);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture'));
      reader.readAsText(file);
    };
    input.click();
  });
}
