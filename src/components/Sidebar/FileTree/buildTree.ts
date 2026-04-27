import type { WorkspaceFile } from '../../../types/file'

export interface FileTreeFolder {
  readonly kind: 'folder'
  readonly name: string
  readonly path: string
  readonly children: readonly FileTreeNode[]
}

export interface FileTreeFile {
  readonly kind: 'file'
  readonly name: string
  readonly path: string
  readonly file: WorkspaceFile
}

export type FileTreeNode = FileTreeFolder | FileTreeFile

interface MutableFolder {
  kind: 'folder'
  name: string
  path: string
  children: FileTreeNode[]
  childFolders: Map<string, MutableFolder>
}

function makeFolder(name: string, p: string): MutableFolder {
  return { kind: 'folder', name, path: p, children: [], childFolders: new Map() }
}

function sortChildren(children: FileTreeNode[]): void {
  children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function buildTree(
  workspacePath: string,
  files: readonly WorkspaceFile[],
): readonly FileTreeNode[] {
  const root = makeFolder('', '')
  const prefix = workspacePath.endsWith('/') ? workspacePath : workspacePath + '/'

  for (const file of files) {
    const rel = file.filePath.startsWith(prefix)
      ? file.filePath.slice(prefix.length)
      : file.filePath
    const parts = rel.split('/').filter(Boolean)
    if (parts.length === 0) continue

    let cursor = root
    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts[i] as string
      let next = cursor.childFolders.get(segment)
      if (!next) {
        const segPath = cursor.path ? `${cursor.path}/${segment}` : segment
        next = makeFolder(segment, segPath)
        cursor.childFolders.set(segment, next)
        cursor.children.push(next as unknown as FileTreeNode)
      }
      cursor = next
    }
    const fileName = parts[parts.length - 1] as string
    const filePath = cursor.path ? `${cursor.path}/${fileName}` : fileName
    cursor.children.push({ kind: 'file', name: fileName, path: filePath, file })
  }

  function sortRec(folder: MutableFolder): void {
    for (const childFolder of folder.childFolders.values()) sortRec(childFolder)
    sortChildren(folder.children)
  }
  sortRec(root)
  return root.children
}
