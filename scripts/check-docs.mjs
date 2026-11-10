#!/usr/bin/env node
/**
 * Documentation gate: word budgets, bilingual pairing, local links, heading
 * anchors, one trailing newline.
 *
 * Every document is written in English and translated beside it as
 * `<name>_zh.md`; the first lines of each half link to the other, so a missing
 * translation and a drifted pair both fail here rather than in review.
 *
 * Budgets and exclusions come from `scripts/doc-budgets.json`, which is
 * authoritative: a file absent from it falls back to 400 words when it is a
 * subtree `AGENTS.md` and 1,200 words under `docs/`; anything else is
 * ungoverned. Chinese files are measured in units — one per CJK character, one
 * per Latin word — and compared against `zhMultiplier` times the English
 * ceiling, because a faithful Chinese rendering of 1,200 English words is
 * longer than 1,200.
 *
 * An empty corpus is a failure: a gate that checks nothing passes everything.
 * Symlinks are skipped so a `CLAUDE.md` alias is never counted twice.
 *
 * Usage: `node scripts/check-docs.mjs`
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage'])
const SUBTREE_BUDGET = 400
const DOCS_BUDGET = 1_200
const ZH_SUFFIX = '_zh.md'

const errors = []

const manifest = JSON.parse(await readFile(join(ROOT, 'scripts/doc-budgets.json'), 'utf8'))
const budgets = manifest.budgets ?? {}
const excludedPairs = new Set(manifest.excludePairs ?? [])
const zhMultiplier = manifest.zhMultiplier ?? 2

async function collect(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (SKIP_DIRECTORIES.has(entry.name) || entry.isSymbolicLink()) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (entry.name.endsWith('.md')) files.push(path)
  }
  return files
}

/** Replace fenced code blocks with blank lines so their contents are not parsed. */
function withoutFences(text) {
  let open = false
  return text.split('\n').map(line => {
    if (line.trimStart().startsWith('```')) {
      open = !open
      return ''
    }
    return open ? '' : line
  }).join('\n')
}

/** GitHub-style heading id, close enough for every heading this repository writes. */
function slug(heading) {
  return heading.toLowerCase().trim()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/\s+/gu, '-')
}

/** Latin word or one CJK character: one unit either way. */
function countUnits(text) {
  const words = text.match(/[A-Za-z0-9][A-Za-z0-9'’._-]*/gu)?.length ?? 0
  const cjk = text.match(/[\u3400-\u9fff\uf900-\ufaff]/gu)?.length ?? 0
  return words + cjk
}

const isChinese = file => file.endsWith(ZH_SUFFIX)
const englishTwin = file => file.slice(0, -ZH_SUFFIX.length) + '.md'

function budgetFor(file) {
  const english = isChinese(file) ? englishTwin(file) : file
  const ceiling = english in budgets
    ? budgets[english]
    : english.endsWith('/AGENTS.md')
      ? SUBTREE_BUDGET
      : english.startsWith('docs/')
        ? DOCS_BUDGET
        : Infinity
  return isChinese(file) ? ceiling * zhMultiplier : ceiling
}

const absoluteFiles = (await collect(ROOT)).sort()
const files = absoluteFiles.map(absolute => relative(ROOT, absolute).split('\\').join('/'))

if (files.length === 0) {
  errors.push('documents: no Markdown files found; refusing to pass an empty corpus')
}

const anchors = new Map()
const contents = new Map()

for (const [index, absolute] of absoluteFiles.entries()) {
  const file = files[index]
  const text = await readFile(absolute, 'utf8')
  contents.set(file, text)
  anchors.set(file, new Set(
    [...withoutFences(text).matchAll(/^#{1,6}\s+(.+)$/gmu)].map(match => slug(match[1])),
  ))
}

for (const file of files) {
  if (excludedPairs.has(file)) continue
  const twin = isChinese(file) ? englishTwin(file) : file.slice(0, -3) + ZH_SUFFIX
  if (!contents.has(twin)) {
    errors.push(`${file}: missing translation ${twin} — every document has a Chinese twin, and every twin an English original`)
    continue
  }
  const twinName = twin.split('/').pop()
  const linkPattern = new RegExp(`\\]\\([^)\\s]*${twinName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}[)#]?[^)\\s]*\\)`, 'u')
  if (!linkPattern.test(withoutFences(contents.get(file)))) {
    errors.push(`${file}: does not link to its twin ${twinName}`)
  }
}

for (const [file, text] of contents) {
  const budget = budgetFor(file)
  const units = countUnits(text)
  if (units > budget) {
    errors.push(`${file}: ${units} units exceeds the ${budget}-unit budget`)
  }

  if (!text.endsWith('\n') || text.endsWith('\n\n')) {
    errors.push(`${file}: file must end with exactly one newline`)
  }

  for (const [index, line] of withoutFences(text).split('\n').entries()) {
    for (const match of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1]
      if (/^(?:https?:|mailto:)/u.test(target)) continue

      const [path, anchor = ''] = target.split('#')
      const destinationPath = path === '' ? join(ROOT, file) : resolve(dirname(join(ROOT, file)), path)
      const destination = relative(ROOT, destinationPath).split('\\').join('/')

      if (!existsSync(destinationPath)) {
        errors.push(`${file}:${index + 1}: missing file ${target}`)
        continue
      }
      if (anchor === '') continue
      if (!contents.has(destination)) {
        errors.push(`${file}:${index + 1}: heading anchor on a non-Markdown target ${target}`)
      } else if (!anchors.get(destination).has(slug(anchor))) {
        errors.push(`${file}:${index + 1}: missing heading ${target}`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  console.error(`\ndocs: ${errors.length} problem(s) in ${files.length} files`)
  process.exit(1)
}

console.log(`docs: ${files.length} files, pairs, links, anchors and budgets hold`)
