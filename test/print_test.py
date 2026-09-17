from pathlib import Path
import pdfplumber
root=Path(__file__).resolve().parents[1]
files=list((root/'output/pdf').glob('*.pdf'))
assert [p.name for p in files]==['gobble-print-and-play.pdf'], 'Only the current complete kit belongs in output/pdf'
assert not list((root/'print').glob('*.pdf')), 'Obsolete print PDFs remain'
with pdfplumber.open(files[0]) as doc:
    assert len(doc.pages)==19
    pages=[p.extract_text() for p in doc.pages]
    for i,p in enumerate(doc.pages):
        assert (p.width,p.height)==(612,792)
        assert all(ch['x0']>=20 and ch['x1']<=592 and ch['top']>=15 and ch['bottom']<=780 for ch in p.chars), f'Text outside safe area on page {i+1}'
    boards=[p.crop((90,140,522,572)).extract_text() for p,t in zip(doc.pages,pages) if 'GOBBLE | Board ' in t]
    assert len(boards)==4
    # Footer instructions contain FOOD and START too: only count component labels.
    assert sum(t.split().count('FOOD') for t in boards)==28
    assert sum(t.count('START 1') for t in boards)==1
    # All printable cells retain one-inch geometry and the reference zone colors.
    board_pages=[p for p,t in zip(doc.pages,pages) if 'GOBBLE | Board ' in t]
    cells=[r for p in board_pages for r in p.rects if abs(r['width']-72)<.01 and abs(r['height']-72)<.01]
    assert len(cells)==116
    fills=[round(r['non_stroking_color'][0]*255) for r in cells]
    assert fills.count(255)==36 and fills.count(239)==28 and fills.count(217)==52
    kits='\n'.join(pages[6:12])
    assert kits.count('/ ARROW ')==36 and kits.count('HEAD >')==6
    assert kits.count('PERSONAL')==6 and kits.count('EXTRA')==36 and kits.count('SCORE')==6
    for name in ['Flip Flop','Whoopsie','Vroom Vroom','Nom Nom','Bounce','Star Power','Rev Up','Careful Slither','Victory Lap']:
        assert sum(t.count(name) for t in pages[12:14])>=2
    assert sum(t.split().count('SPECIAL') for t in pages[14:16])==18
    assert all(len(p.images)==9 for p in doc.pages[14:16]), 'Card backs must use shared icon'
    assert sum(t.count('2 + CARD') for t in pages[16:18])==100
    assert all(len(p.images)==50 for p in doc.pages[16:18]), 'Special food must use shared icon'
    assert all(str(n) in pages[18].split() for n in range(51))
print('PDF verified: 19 Letter pages, safe text bounds, complete components, shared icons, one current output')
