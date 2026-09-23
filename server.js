const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_USER=process.env.ADMIN_USER||'admin';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'change-me';
const dataDir=path.join(__dirname,'data');
const dataFile=path.join(dataDir,'products.json');
if(!fs.existsSync(dataDir))fs.mkdirSync(dataDir,{recursive:true});
if(!fs.existsSync(dataFile))fs.writeFileSync(dataFile,'[]');
app.use(express.json({limit:'2mb'}));
app.use(express.static(path.join(__dirname,'public')));
function auth(req,res,next){
 const h=req.headers.authorization||'';
 if(h.startsWith('Basic ')){try{const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');if(u===ADMIN_USER&&p===ADMIN_PASSWORD)return next();}catch{}}
 res.set('WWW-Authenticate','Basic realm="Pekarna Admin"');res.status(401).send('Потрібна авторизація');
}
function read(){try{return JSON.parse(fs.readFileSync(dataFile,'utf8'))}catch{return []}}
function write(x){fs.writeFileSync(dataFile,JSON.stringify(x,null,2))}
app.get('/health',(req,res)=>res.json({ok:true}));
app.get('/admin/',auth,(req,res)=>res.sendFile(path.join(__dirname,'admin','index.html')));
app.get('/api/products',auth,(req,res)=>res.json(read()));
app.post('/api/products',auth,(req,res)=>{const p=read();const item={id:Date.now().toString(),name:String(req.body.name||''),price:Number(req.body.price||0),image:String(req.body.image||''),description:String(req.body.description||'')};if(!item.name)return res.status(400).json({error:'Назва обов’язкова'});p.push(item);write(p);res.json(item)});
app.put('/api/products/:id',auth,(req,res)=>{const p=read();const i=p.findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);p[i]={...p[i],...req.body,id:p[i].id,price:Number(req.body.price||p[i].price)};write(p);res.json(p[i])});
app.delete('/api/products/:id',auth,(req,res)=>{write(read().filter(x=>x.id!==req.params.id));res.sendStatus(204)});
app.get('/api/orders',(req,res)=>res.status(501).json({message:'Telegram integration will be enabled after bot token/chat ID are added as Render environment variables.'}));
app.listen(PORT,'0.0.0.0',()=>console.log(`Pekarna server listening on ${PORT}`));
