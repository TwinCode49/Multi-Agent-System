import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export class Differ {
  diff(basePath, plan) {
    const entries = [];

    for (const file of plan.create || []) {
      const exists = existsSync(join(basePath, file.path));
      entries.push({
        type: exists ? 'modify' : 'create',
        path: file.path,
        content: file.content,
        exists,
      });
    }

    for (const file of plan.modify || []) {
      const fullPath = join(basePath, file.path);
      const current = existsSync(fullPath) ? readFileSync(fullPath, 'utf-8') : null;
      entries.push({
        type: 'modify',
        path: file.path,
        before: current,
        after: file.content,
        exists: current !== null,
      });
    }

    for (const dir of plan.directories || []) {
      entries.push({
        type: 'directory',
        path: dir.endsWith('/') ? dir : dir + '/',
      });
    }

    return entries;
  }

  print(entries) {
    if (entries.length === 0) {
      console.log('  No changes planned.');
      return;
    }

    for (const entry of entries) {
      if (entry.type === 'directory') {
        console.log(`  📁  ${entry.path}`);
      } else if (entry.type === 'create') {
        console.log(`  ✚  ${entry.path}`);
      } else if (entry.type === 'modify') {
        console.log(`  ✎  ${entry.path}`);
        if (entry.before !== null && entry.after) {
          const beforeLines = entry.before.split('\n');
          const afterLines = entry.after.split('\n');
          const maxLines = Math.max(beforeLines.length, afterLines.length);
          let changes = 0;
          for (let i = 0; i < maxLines; i++) {
            if (beforeLines[i] !== afterLines[i]) changes++;
          }
          if (changes > 0) console.log(`      ${changes} line(s) changed`);
        }
      }
    }

    const created = entries.filter(e => e.type === 'create').length;
    const modified = entries.filter(e => e.type === 'modify').length;
    const dirs = entries.filter(e => e.type === 'directory').length;

    console.log(`\n  Summary: ${dirs} dir(s), ${created} file(s) to create, ${modified} file(s) to modify`);
  }
}
