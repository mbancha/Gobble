import {spawnSync} from 'node:child_process';
const script=process.argv.includes('--test')?'test/print_test.py':'print/generate_pnp.py';
const result=spawnSync(process.env.PYTHON||'python',[script],{stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exit(1)}
process.exit(result.status??1);
