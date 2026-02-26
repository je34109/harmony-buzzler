/**
 * Simple in-memory store to pass a File object between pages.
 * Since File objects can't be serialized to URL params or sessionStorage,
 * we store it in a module-level variable and consume it once on the analyze page.
 */

let _pendingFile: File | null = null;
let _pendingTitle: string = "";

export function setPendingFile(file: File, title: string) {
  _pendingFile = file;
  _pendingTitle = title;
}

export function consumePendingFile(): { file: File; title: string } | null {
  if (!_pendingFile) return null;
  const result = { file: _pendingFile, title: _pendingTitle };
  _pendingFile = null;
  _pendingTitle = "";
  return result;
}
