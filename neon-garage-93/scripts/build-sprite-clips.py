from PIL import Image
from pathlib import Path
import json, subprocess

root=Path(__file__).resolve().parents[1]
meta=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');global.window=global;for(const n of ['cars','catalog-v06','scene'])vm.runInThisContext(fs.readFileSync('js/'+n+'.js','utf8'));console.log(JSON.stringify(NG.catalog.map(m=>({id:m.id,sheet:NG.spriteSheets[m.id],frame:NG.spriteFrames[m.id]}))))"],cwd=root,text=True))
clips={};audit=[]
for sheet in sorted({m['sheet'] for m in meta}):
 im=Image.open(root/'assets'/sheet);w,h=im.size
 pixels=bytearray(im.getchannel('A').point(lambda a:1 if a>128 else 0).tobytes())
 components=[]
 for seed in range(len(pixels)):
  if not pixels[seed]:continue
  pixels[seed]=0;todo=[seed];members=[];x0=w;y0=h;x1=y1=0
  while todo:
   k=todo.pop();x=k%w;y=k//w;members.append(k);x0=min(x0,x);y0=min(y0,y);x1=max(x1,x);y1=max(y1,y)
   for n in ([k-1] if x else [])+([k+1] if x<w-1 else [])+([k-w] if y else [])+([k+w] if y<h-1 else []):
    if pixels[n]:pixels[n]=0;todo.append(n)
  if len(members)>=12:components.append({'area':len(members),'box':[x0,y0,x1+1,y1+1],'pixels':members})
 main=[c for c in components if c['area']>1500]
 # The Delta and Saab outlines touch in the generated European atlas.
 if sheet=='cars-v06-europe.png':
  merged=next(c for c in main if c['box'][2]-c['box'][0]>650);main.remove(merged)
  for side in (0,1):
   members=[k for k in merged['pixels'] if (k%w<833)==(side==0)]
   xs=[k%w for k in members];ys=[k//w for k in members]
   main.append({'area':len(members),'box':[min(xs),min(ys),max(xs)+1,max(ys)+1],'pixels':members})
 expected=1 if sheet.startswith("car-") else 10
 assert len(main)==expected,(sheet,len(main))
 main.sort(key=lambda c:(0 if c['box'][1]<h/2 else 1,c['box'][0]))
 owner=[-1]*(w*h)
 for i,c in enumerate(main):
  for k in c['pixels']:owner[k]=i
 # Keep detached mirrors/highlights close to their own car, never another car's body.
 for small in components:
  if small['area']>1500:continue
  x0,y0,x1,y1=small['box'];cx=(x0+x1)/2;cy=(y0+y1)/2
  distances=[]
  for i,c in enumerate(main):
   a,b,d,e=c['box'];dist=max(a-cx,0,cx-d)**2+max(b-cy,0,cy-e)**2;distances.append(dist)
  index=min(range(len(main)),key=lambda i:distances[i])
  if distances[index]<=20**2:
   for k in small['pixels']:owner[k]=index;main[index]['pixels'].append(k)
 for frame,c in enumerate(main):
  rows={}
  for k in c['pixels']:
   x=k%w;y=k//w
   if y not in rows:rows[y]=[x,x]
   else:rows[y][0]=min(rows[y][0],x);rows[y][1]=max(rows[y][1],x)
  rectangles=[]
  for y,(left,right) in sorted(rows.items()):
   start=None
   for x in range(left,right+2):
    allowed=x<=right and owner[y*w+x] in (-1,frame)
    if allowed and start is None:start=x
    if not allowed and start is not None:rectangles.append([start,y,x-start,1]);start=None
  # Merge equal spans vertically to keep the SVG clip path compact.
  merged=[]
  for rect in rectangles:
   if merged and rect[0]==merged[-1][0] and rect[2]==merged[-1][2] and rect[1]==merged[-1][1]+merged[-1][3]:merged[-1][3]+=1
   else:merged.append(rect)
  x0=min(r[0] for r in merged);y0=min(r[1] for r in merged);x1=max(r[0]+r[2] for r in merged);y1=max(r[1]+r[3] for r in merged)
  d=''.join(f'M{x},{y}h{rw}v{rh}h-{rw}z' for x,y,rw,rh in merged)
  model=next((m for m in meta if m['sheet']==sheet and m['frame']==frame),None)
  if model is None:continue
  clips[model['id']]={'sheet':sheet,'size':[w,h],'bounds':[x0,y0,x1-x0,y1-y0],'path':d}
  leaked=sum(owner[y*w+x] not in (-1,frame) for left,top,rw,rh in merged for y in range(top,top+rh) for x in range(left,left+rw))
  assert leaked==0,(model['id'],leaked)
  audit.append({'model':model['id'],'sheet':sheet,'bounds':clips[model['id']]['bounds'],'foreignBodyPixels':leaked})
assert len(clips)==60
(root/'js/sprite-clips.js').write_text('// Individual silhouette clips for the source atlases; generated from visible alpha, not an assumed grid.\nNG.spriteClips='+json.dumps(clips,separators=(',',':'))+';\n')
(root/'assets/SPRITE-CLIP-AUDIT.json').write_text(json.dumps(audit,indent=2)+'\n')
print('60 per-model silhouette clips generated; zero pixels from another vehicle body inside any clip.')
