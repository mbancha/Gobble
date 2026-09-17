"""Build the only current PnP. Board and rules sources also drive verification."""
from pathlib import Path
from io import BytesIO
import json, re, math
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'output/pdf/gobble-print-and-play.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
BOARD = json.loads((ROOT/'print/board.json').read_text())
SPECIAL_ICON = str(ROOT/'print/assets/special-icon.png')
W,H=612,792
INK=colors.HexColor('#172b38'); TEAL=colors.HexColor('#137d78')
GOLD=colors.HexColor('#f2ba4b'); PURPLE=colors.HexColor('#8063bd')
PLAYERS=[('Red','R','#c43e45'),('Green','G','#188255'),('Blue','B','#346bcc'),
         ('Yellow','Y','#ad7c13'),('Orange','O','#cb5f21'),('Purple','P','#8063bd')]

def markup(s):
    return re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',escape(s)).replace('×',' x ').replace('–','-').replace('—',' - ')

rules=(ROOT/'RULES.md').read_text(encoding='utf-8')
styles=getSampleStyleSheet()
for key in ['Normal','BodyText']:
    styles[key].fontSize=10; styles[key].leading=14; styles[key].textColor=INK
styles['Heading1'].textColor=TEAL; styles['Heading2'].textColor=TEAL
story=[]
for block in rules.split('\n\n'):
    # Digital controls and development history belong in the repo, not the physical kit.
    if block.startswith('## Digital adaptation'): break
    if block.startswith('# '): story.append(Paragraph('GOBBLE | Rules',styles['Title']))
    elif block.startswith('## '): story.append(Paragraph(markup(block[3:]),styles['Heading2']))
    elif block.startswith('- '):
        for item in re.split(r'\n- ',block[2:]): story.extend([Paragraph(markup(item.replace('\n',' ')),styles['BodyText']),Spacer(1,5)])
    else: story.extend([Paragraph(markup(block.replace('\n',' ')),styles['BodyText']),Spacer(1,4)])
rulebuf=BytesIO()
def foot(c,d):
    c.setFont('Helvetica',8);c.setFillColor(INK)
    c.drawString(36,24,'GOBBLE / Current rules / Print at 100%');c.drawRightString(576,24,str(d.page))
SimpleDocTemplate(rulebuf,pagesize=(W,H),rightMargin=40,leftMargin=40,topMargin=35,bottomMargin=40).build(story,onFirstPage=foot,onLaterPages=foot)
buf=BytesIO();c=canvas.Canvas(buf,pagesize=(W,H),invariant=1)
def text(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(color);c.setFont('Helvetica-Bold' if bold else 'Helvetica',size);c.drawString(x,y,s)
def center(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(color);c.setFont('Helvetica-Bold' if bold else 'Helvetica',size);c.drawCentredString(x,y,s)
def box(x,y,w,h,fill=colors.white):
    c.setStrokeColor(INK);c.setLineWidth(.6);c.setFillColor(fill);c.rect(x,y,w,h,fill=1)
def para(x,y,w,s,size=10):
    st=styles['BodyText'].clone('component');st.fontSize=size;st.leading=size*1.35
    p=Paragraph(markup(s),st);_,h=p.wrap(w,1000);p.drawOn(c,x,y-h);return y-h
def page(title,sub):
    text(36,750,title,22,TEAL,True);text(36,727,sub,9)
    text(36,22,'GOBBLE / Print at 100% / Single-sided / Cut solid outlines',8)
def finish():c.showPage()

def special_icon(x,y,size):
    c.drawImage(SPECIAL_ICON,x,y,size,size,mask='auto',preserveAspectRatio=True,anchor='c')

# The four sheets assemble one board, never four independent mini-boards.
for q in range(4):
    ox=(q%2)*6;oy=(q//2)*6
    page('GOBBLE | Board '+chr(65+q),'Join A B above C D. Cut the outer square; match the cell labels.')
    x0,y0=90,220
    c.setStrokeColor(INK);c.setDash(3,3);c.rect(x0,y0,432,432);c.setDash()
    for yy in range(6):
      for xx in range(6):
        x,y=ox+xx,oy+yy;px=x0+xx*72;py=y0+(5-yy)*72
        zone=BOARD['zones'][y][x]
        if zone=='.': continue
        box(px,py,72,72,colors.HexColor({'2':'#ffffff','3':'#efefef','5':'#d9d9d9'}[zone]))
        text(px+4,py+59,f'{x+1},{y+1}',7)
        if [x,y] in BOARD['regularFood']:
          c.setFillColor(GOLD);c.circle(px+36,py+34,17,fill=1,stroke=0)
          center(px+36,py+30,'1',14,INK,True)
          center(px+36,py+9,'FOOD',7)
        if [x,y] in BOARD['specialFood']:
          n=BOARD['specialFood'].index([x,y])+1
          c.setStrokeColor(PURPLE);c.setDash(2,2);c.circle(px+36,py+40,22,stroke=1,fill=0);c.setDash()
          special_icon(px+21,py+25,30)
          center(px+36,py+10,'START '+str(n),8,PURPLE,True)
    para(90,180,432,'**2 players:** white 6 x 6. **3-4:** white + light gray 8 x 8. **5-6:** all colored cells, including the dark gray arms. Blank cut-out corners are outside the board.',11)
    para(90,115,432,'Join the four 6-inch squares. Each cell is one inch. Place one SPECIAL token on START 1 in every game. Printed FOOD spots never run out.',10)
    finish()

for name,letter,col in PLAYERS:
    color=colors.HexColor(col)
    page('GOBBLE | '+name.upper(),f'{letter} / One complete player kit / Use color AND letter to identify pieces')
    box(36,505,540,195)
    text(48,678,name.upper()+' / PLAYER MAT',15,color,True)
    text(48,654,'Start length 3. Maximum 13. Score as you eat; never cash out on death.',10)
    text(48,635,'Keep one body piece in each box. Remove left to right as you grow.',10)
    for i in range(10):
      xx=48+i*51;box(xx,560,47,55)
      center(xx+23.5,590,str(i+1),12,color,True)
      center(xx+23.5,573,'+ BOOST' if i+1 in (3,6,10) else 'GROW',7)
    text(48,540,'Food 1 = grow 1 / +1 point. Super or special 2 = grow 2 / +2 points.',10)
    text(48,523,'At max: +2 per food unit. Personal boost refreshes every round.',10)
    # Six compact arrow cards, rotated to select direction.
    for i in range(6):
      xx=36+(i%3)*180;yy=325-(i//3)*107
      box(xx,yy,172,96)
      text(xx+8,yy+78,f'{letter} / ARROW {i+1}',9,color,True)
      c.setStrokeColor(color);c.setLineWidth(6);c.line(xx+86,yy+18,xx+86,yy+61)
      c.line(xx+86,yy+61,xx+72,yy+47);c.line(xx+86,yy+61,xx+100,yy+47)
      text(xx+8,yy+7,'Rotate to move 1; boost = 3',8)
    # Printable head plus 12 bodies. All fit the one-inch board.
    for i in range(13):
      xx=36+i*41;box(xx,148,37,45,colors.HexColor('#f7f8fa'))
      center(xx+18.5,174,letter,12,color,True)
      center(xx+18.5,158,'HEAD >' if i==0 else str(i),7,color,True)
    for i in range(8):
      xx=36+i*67;ww=40 if i==7 else 62;box(xx,70,ww,56 if i<7 else 48)
      center(xx+ww/2,106,letter,10,color,True)
      center(xx+ww/2,92,'PERSONAL' if i==0 else 'SCORE' if i==7 else 'EXTRA',7)
      center(xx+ww/2,80,'BOOST' if i<7 else 'MARKER',7)
    text(36,45,'Personal: use once each round. Extras: spend and return to supply; hold at most 6.',9)
    finish()

specials=[]
section=rules.split('## Special cards')[1].split('## Digital adaptation')[0]
for item in re.split(r'\n- ',section)[1:]:
    head,body=item.split(':** ',1);head=head.replace('**','').replace('\n',' ')
    name,when=head.split(' — ');specials.append((name,when,body.strip().replace('\n',' ')))
assert len(specials)==9
for copy in range(2):
    page('GOBBLE | Special cards',f'Copy {copy+1} of 2 / Shuffle all 18 together / Discard after playing')
    for i,(name,when,body) in enumerate(specials):
      x=36+(i%3)*182;y=500-(i//3)*220
      box(x,y,174,207)
      text(x+10,y+182,name,13,PURPLE,True)
      yy=para(x+10,y+163,154,when.upper(),8)
      para(x+10,yy-16,154,body,11)
      text(x+10,y+12,'GOBBLE / SPECIAL',8,PURPLE)
    finish()

# Matching backs: cut and glue to fronts, preserving single-sided printing.
for copy in range(2):
    page('GOBBLE | Special card backs',f'Copy {copy+1} of 2 / Cut and glue to special-card fronts')
    for i in range(9):
      x=36+(i%3)*182;y=500-(i//3)*220
      box(x,y,174,207)
      special_icon(x+42,y+65,90)
      center(x+87,y+40,'SPECIAL',14,PURPLE,True)
    finish()

# 100 fold-over tokens, two sheets of 50. One token can show either face.
for sheet in range(2):
    page('GOBBLE | Food tokens',f'Sheet {sheet+1} of 2 / Cut rectangles, fold dotted centers, glue backs together')
    for i in range(50):
      x=36+(i%5)*108;y=645-(i//5)*62
      box(x,y,96,48,GOLD)
      c.setFillColor(colors.HexColor('#e7ddf5'));c.rect(x+48,y,48,48,fill=1,stroke=0)
      c.setStrokeColor(INK);c.rect(x,y,96,48,fill=0,stroke=1)
      center(x+24,y+30,'SUPER',7,INK,True);center(x+24,y+11,'2',17,INK,True)
      special_icon(x+61,y+20,22);center(x+72,y+7,'2 + CARD',8,PURPLE,True)
      c.setDash(2,2);c.line(x+48,y,x+48,y+48);c.setDash()
    text(36,47,'Each final token is 2/3 inch square. Food value means segments; apply capped scoring.',9)
    finish()

page('GOBBLE | Score & spinner','Track 0-50 / Default goal 30 / Finish the movement beat; ties share the win')
for n in range(51):
    x=36+(n%10)*54;y=620-(n//10)*54
    box(x,y,50,50,colors.HexColor('#d7eee9') if n==30 else colors.white)
    center(x+25,y+20,str(n),18,TEAL if n==30 else INK,True)
text(104,345,'30 = default finish line. Score immediately; death adds nothing.',10)
cx,cy,r=180,195,92
for i in range(3):
    c.setFillColor(PURPLE if i==0 else GOLD)
    path=c.beginPath();path.moveTo(cx,cy);path.arcTo(cx-r,cy-r,cx+r,cy+r,i*120,120);path.close()
    c.drawPath(path,fill=1,stroke=1)
    angle=math.radians(i*120+60)
    center(cx+math.cos(angle)*57,cy+math.sin(angle)*57,'SPECIAL' if i==0 else 'SUPER',9,colors.white if i==0 else INK,True)
c.setFillColor(INK);c.circle(cx,cy,3,fill=1)
para(306,270,262,'**Death food spinner**\nSpin once for the old head and once for the old tail. One-third SPECIAL, two-thirds SUPER. Spin again if on a line. Use a paperclip around a pencil held on the center dot.',12)
finish();c.save()
writer=PdfWriter()
for source in [rulebuf,buf]:
    source.seek(0)
    for p in PdfReader(source).pages:writer.add_page(p)
writer.add_metadata({'/Title':'Gobble - Complete Print and Play','/Author':'Gobble','/Subject':'2-6 players / Nested 6x6, 8x8 and shaped 12x12 board'})
with OUT.open('wb') as f:writer.write(f)
print(f'{OUT}: {len(writer.pages)} pages')
