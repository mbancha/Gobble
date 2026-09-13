from pathlib import Path
import pdfplumber
root=Path(__file__).resolve().parents[1]
files=list((root/'output/pdf').glob('*.pdf'))
assert [p.name for p in files]==['gobble-print-and-play.pdf'], 'Only the current complete kit belongs in output/pdf'
assert not list((root/'print').glob('*.pdf')), 'Obsolete print PDFs remain'
with pdfplumber.open(files[0]) as doc:
    assert len(doc.pages)==17
    pages=[p.extract_text() for p in doc.pages]
    for i,p in enumerate(doc.pages):
        assert (p.width,p.height)==(612,792)
        assert all(ch['x0']>=20 and ch['x1']<=592 and ch['top']>=15 and ch['bottom']<=780 for ch in p.chars), f'Text outside safe area on page {i+1}'
    assert sum(t.count('FOOD') for t in pages[2:6])==10
    assert sum(t.count('START ') for t in pages[2:6])==3
    kits='\n'.join(pages[6:12])
    assert kits.count('/ ARROW ')==36 and kits.count('HEAD >')==6
    assert kits.count('PERSONAL')==6 and kits.count('EXTRA')==36 and kits.count('SCORE')==6
    for name in ['Flip Flop','Whoopsie','Vroom Vroom','Nom Nom','Bounce','Star Power','Rev Up','Careful Slither','Victory Lap']:
        assert sum(t.count(name) for t in pages[12:14])>=2
    assert sum(t.count('2 + CARD') for t in pages[14:16])==100
    assert all(str(n) in pages[16].split() for n in range(51))
print('PDF verified: 17 Letter pages, safe text bounds, complete components, one current output')
