import { startProof1, stopProof1, handleProof1Resize } from './cross-product-proof.js';
import { startProof2, stopProof2, handleProof2Resize } from './adjoint-proof.js';

let tabExplorer, tabProofs;
let subtabCross, subtabAdjoint;
let explorerRoot, proofsRoot;
let crossPanel, adjointPanel;

let currentMainMode = 'explorer'; // 'explorer' | 'proofs'
let currentProofSubtab = 'cross'; // 'cross' | 'adjoint'

/**
 * Switches the top-level mode between Rotation Explorer and Kinematics Proofs.
 * @param {'explorer'|'proofs'} mode
 */
export function setMainMode(mode) {
  currentMainMode = mode;

  if (mode === 'explorer') {
    tabExplorer?.classList.add('active');
    tabProofs?.classList.remove('active');

    if (explorerRoot) explorerRoot.style.display = '';
    if (proofsRoot) proofsRoot.style.display = 'none';

    // Pause proof render loops to conserve GPU/CPU
    stopProof1();
    stopProof2();

    // Trigger resize on window to keep explorer canvas sharp
    window.dispatchEvent(new Event('resize'));
  } else {
    tabExplorer?.classList.remove('active');
    tabProofs?.classList.add('active');

    if (explorerRoot) explorerRoot.style.display = 'none';
    if (proofsRoot) proofsRoot.style.display = 'flex';

    // Activate the current proof subtab
    setProofSubtab(currentProofSubtab);
  }
}

/**
 * Switches between Proof 1 (Cross Product) and Proof 2 (Skew Adjoint).
 * @param {'cross'|'adjoint'} subtab
 */
export function setProofSubtab(subtab) {
  currentProofSubtab = subtab;

  if (subtab === 'cross') {
    subtabCross?.classList.add('active');
    subtabAdjoint?.classList.remove('active');

    if (crossPanel) crossPanel.style.display = 'flex';
    if (adjointPanel) adjointPanel.style.display = 'none';

    stopProof2();
    startProof1();
    handleProof1Resize();
  } else {
    subtabCross?.classList.remove('active');
    subtabAdjoint?.classList.add('active');

    if (crossPanel) crossPanel.style.display = 'none';
    if (adjointPanel) adjointPanel.style.display = 'flex';

    stopProof1();
    startProof2();
    handleProof2Resize();
  }
}

/**
 * Initializes mode switcher listeners and tab bindings.
 */
export function initModeSwitcher() {
  tabExplorer = document.getElementById('tab-explorer');
  tabProofs = document.getElementById('tab-proofs');

  subtabCross = document.getElementById('subtab-cross');
  subtabAdjoint = document.getElementById('subtab-adjoint');

  explorerRoot = document.getElementById('rotation-explorer-root');
  proofsRoot = document.getElementById('kinematics-proofs-root');

  crossPanel = document.getElementById('proof-cross-panel');
  adjointPanel = document.getElementById('proof-adjoint-panel');

  if (tabExplorer) {
    tabExplorer.addEventListener('click', () => setMainMode('explorer'));
  }
  if (tabProofs) {
    tabProofs.addEventListener('click', () => setMainMode('proofs'));
  }

  if (subtabCross) {
    subtabCross.addEventListener('click', () => setProofSubtab('cross'));
  }
  if (subtabAdjoint) {
    subtabAdjoint.addEventListener('click', () => setProofSubtab('adjoint'));
  }

  // Ensure default mode is explorer
  setMainMode('explorer');
}

// Auto-initialize when loaded as module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModeSwitcher);
} else {
  initModeSwitcher();
}
