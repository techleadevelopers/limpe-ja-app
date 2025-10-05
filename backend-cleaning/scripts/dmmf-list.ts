import { Prisma } from '@prisma/client';

const dmmf = Prisma.dmmf;

function printModels() {
  for (const m of dmmf.datamodel.models) {
    console.log(`MODEL ${m.name}`);
    for (const f of m.fields) {
      const rel = f.relationName ? ` [rel:${f.relationName}]` : '';
      const req = f.isRequired ? 'req' : 'opt';
      const list = f.isList ? '[]' : '';
      const unique = f.isUnique ? ' unique' : '';
      const id = f.isId ? ' id' : '';
      console.log(`  - ${f.name}: ${f.type}${list} (${req})${id}${unique}${rel}`);
    }
  }
}

function printEnums() {
  for (const e of dmmf.datamodel.enums) {
    console.log(`ENUM ${e.name}: ${e.values.map((v) => v.name).join(', ')}`);
  }
}

printEnums();
console.log('');
printModels();

