// Embed the shared print icon so the digital game still works as one offline file.
import fs from 'node:fs';
const htmlPath=new URL('../index.html',import.meta.url);
const html=fs.readFileSync(htmlPath,'utf8');
const bytes=fs.readFileSync(new URL('../print/assets/special-icon.png',import.meta.url));
const block=`// special-icon:start\nconst SPECIAL_FOOD_IMAGE = new Image();\nSPECIAL_FOOD_IMAGE.src = 'data:image/png;base64,${bytes.toString('base64')}';\n// special-icon:end`;
const next=html.replace(/\/\/ special-icon:start[\s\S]*?\/\/ special-icon:end/,block);
if(!html.includes('// special-icon:start'))throw Error('Missing image markers');
if(process.argv.includes('--check')) {
  if(next!==html)throw Error('Special icon is stale: npm run build:assets');
  console.log('Print/digital special icon matches');
}else if(next!==html)fs.writeFileSync(htmlPath,next);
