// === GitHub Sync ===
// Sync app data to a GitHub repo via Contents API

const SYNC_KEY = 'mesroutines_sync';
const DATA_PATH = 'data.json';
const API_BASE = 'https://api.github.com';

let _config = null;
let _fileSha = null;
let _debounceTimer = null;
let _lastSyncTime = null;

// === Config (stored separately from app state — token never exported) ===

export function initSync() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    _config = raw ? JSON.parse(raw) : createDefaultConfig();
  } catch {
    _config = createDefaultConfig();
  }
  return _config;
}

function createDefaultConfig() {
  const detected = detectRepoFromUrl();
  return {
    enabled: false,
    token: '',
    owner: detected.owner,
    repo: detected.repo,
    lastSync: null,
  };
}

function detectRepoFromUrl() {
  try {
    const host = window.location.hostname;
    const path = window.location.pathname;
    // GitHub Pages: username.github.io/repo-name/
    if (host.endsWith('.github.io')) {
      const owner = host.replace('.github.io', '');
      const repo = path.split('/').filter(Boolean)[0] || '';
      return { owner, repo };
    }
  } catch {}
  return { owner: '', repo: '' };
}

export function getSyncConfig() {
  if (!_config) initSync();
  return { ..._config };
}

export function saveSyncConfig(updates) {
  if (!_config) initSync();
  Object.assign(_config, updates);
  localStorage.setItem(SYNC_KEY, JSON.stringify(_config));
}

export function getLastSyncTime() {
  return _config?.lastSync || null;
}

// === GitHub API ===

async function githubFetch(path, options = {}) {
  const config = getSyncConfig();
  if (!config.token || !config.owner || !config.repo) {
    throw new Error('Sync non configuré');
  }

  const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${response.status}`);
  }

  return response.json();
}

// === Pull ===

export async function pullFromGitHub() {
  const config = getSyncConfig();
  if (!config.enabled || !config.token) return null;

  try {
    const result = await githubFetch(DATA_PATH);
    if (!result) return null;

    _fileSha = result.sha;
    const content = atob(result.content);
    const data = JSON.parse(content);

    _lastSyncTime = new Date().toISOString();
    saveSyncConfig({ lastSync: _lastSyncTime });

    return data;
  } catch (e) {
    console.warn('GitHub pull failed:', e.message);
    return null;
  }
}

// === Push ===

export async function pushToGitHub(stateJson) {
  const config = getSyncConfig();
  if (!config.enabled || !config.token) return false;

  try {
    // Get current SHA if we don't have it
    if (!_fileSha) {
      const existing = await githubFetch(DATA_PATH);
      if (existing) _fileSha = existing.sha;
    }

    const content = btoa(unescape(encodeURIComponent(stateJson)));

    const body = {
      message: `sync: ${new Date().toLocaleString('fr-FR')}`,
      content,
    };
    if (_fileSha) body.sha = _fileSha;

    const result = await githubFetch(DATA_PATH, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (result) {
      _fileSha = result.content.sha;
      _lastSyncTime = new Date().toISOString();
      saveSyncConfig({ lastSync: _lastSyncTime });
      return true;
    }
    return false;
  } catch (e) {
    console.warn('GitHub push failed:', e.message);
    return false;
  }
}

// === Debounced push (called on every saveState) ===

export function debouncedPush(stateJson) {
  const config = getSyncConfig();
  if (!config.enabled) return;

  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    pushToGitHub(stateJson);
  }, 3000);
}

// === Test connection ===

export async function testConnection() {
  const config = getSyncConfig();
  const debug = [`token: ${config.token?.length || 0} chars, starts "${config.token?.slice(0, 12)}..."`, `owner: "${config.owner}"`, `repo: "${config.repo}"`];

  if (!config.token || !config.owner || !config.repo) {
    return { ok: false, error: `Config incomplète\n${debug.join('\n')}` };
  }

  try {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}`;
    debug.push(`url: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    debug.push(`status: ${response.status}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      debug.push(`body: ${JSON.stringify(body).slice(0, 200)}`);
      return { ok: false, error: `Erreur ${response.status}\n${debug.join('\n')}` };
    }

    const repo = await response.json();
    return { ok: true, repoName: repo.full_name };
  } catch (e) {
    debug.push(`exception: ${e.message}`);
    return { ok: false, error: debug.join('\n') };
  }
}

// === Manual sync (pull then push) ===

export async function manualSync(getCurrentState) {
  const config = getSyncConfig();
  if (!config.enabled || !config.token) {
    return { ok: false, error: 'Sync non activé' };
  }

  try {
    // Push current state
    const stateJson = JSON.stringify(getCurrentState());
    const pushed = await pushToGitHub(stateJson);
    if (pushed) {
      return { ok: true };
    }
    return { ok: false, error: 'Échec du push' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
