import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const baseHeaders:Record<string,string>={'Access-Control-Allow-Headers':'content-type,x-session,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const fail=(message:string)=>{throw new Error(message)};
function checked(r:any){if(r.error)throw new Error('저장 서버에 문제가 있어요. 잠시 후 다시 해 주세요.');return r.data;}
const text=(v:any,max=300)=>{if(typeof v!=='string'||v.length>max)fail('입력 내용을 확인해 주세요.');return v.trim();};
const uuid=(v:any)=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
async function session(role:string,student_id:string|null=null){const token=crypto.randomUUID()+crypto.randomUUID();checked(await db.from('du_sessions').insert({token_hash:await hash(token),role,student_id}));return token;}
async function own(token:string){if(!token)fail('다시 입장해 주세요.');const data=checked(await db.from('du_sessions').select('*').eq('token_hash',await hash(token)).gt('expires_at',new Date().toISOString()).maybeSingle());if(!data)fail('입장 시간이 만료되었어요. 다시 입장해 주세요.');return data;}
async function studentState(id:string){const s=checked(await db.from('du_students').select('*').eq('id',id).single());const c=checked(await db.from('du_classes').select('*').eq('id',s.class_id).single());const a=checked(await db.from('du_answers').select('*').eq('student_id',id));const card=checked(await db.from('du_cards').select('*').eq('student_id',id).maybeSingle());return {student:s, classroom:c,answers:a,card};}
async function board(class_id:string,full:boolean){const c=checked(await db.from('du_classes').select('*').eq('id',class_id).single());const students=checked(await db.from('du_students').select('id,nickname,current_case,current_step,created_at').eq('class_id',class_id).order('created_at'));
const ids=students.map((s:any)=>s.id);if(!ids.length)return {classroom:c,students:[],answers:[],cards:[],votes:[]};
const answers=checked(await db.from('du_answers').select('*').in('student_id',ids));const cards=checked(await db.from('du_cards').select('*').in('student_id',ids));const votes=checked(await db.from('du_votes').select('student_id,card_id').in('student_id',ids));
return full?{classroom:c,students,answers,cards,votes}:{classroom:c,students:students.map((s:any)=>({id:s.id,nickname:s.nickname})),cards:cards.map((c:any)=>({id:c.id,student_id:c.student_id,stamp:c.stamp})),votes,averages:[1,2,3,4].map(n=>{const done=answers.filter((a:any)=>a.case_no===n&&a.completed);return {case_no:n,count:done.length,average:done.length?done.reduce((s:number,a:any)=>s+a.found_items.length,0)/done.length:null};})};}
Deno.serve(async req=>{
 const headers={...baseHeaders};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 const origin=req.headers.get('origin');
 if(origin && !['https://moakit-digital-undertaker.cuteheea0.chatgpt.site','http://terminal.local:4173'].includes(origin))return reply({error:'허용되지 않은 앱 주소입니다.'},403);
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 try {
 const raw=await req.text();if(raw.length>20000)return reply({error:'입력 내용이 너무 길어요.'},413);const b=JSON.parse(raw);const action=b.action;
 if(['teacher_login','join','resume'].includes(action)){
 const key=await hash((req.headers.get('x-forwarded-for')||'classroom')+Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')+':'+action);
 const ok=checked(await db.rpc('du_rate_limit',{p_key:key,p_limit:action==='teacher_login'?15:240,p_seconds:300}));if(!ok)return reply({error:'요청이 많아요. 5분 후 다시 시도해 주세요.'},429);
 }
 if(action==='teacher_login'){if(b.password!=='3035')return reply({error:'비밀번호를 확인해 주세요.'},401);return reply({token:await session('teacher')});}
 if(action==='join'||action==='resume'){
 const code=text(b.code,4);if(!/^\d{4}$/.test(code))fail('수업코드 네 자리를 입력해 주세요.');let nick=text(b.nickname,action==='resume'?24:16).replace(/\s+/g,' ');if(!nick)fail('별명을 입력해 주세요.');
 const c=checked(await db.from('du_classes').select('*').eq('code',code).maybeSingle());if(!c)fail('수업코드를 다시 확인해 주세요.');let s:any;
 if(action==='resume'){s=checked(await db.from('du_students').select('*').eq('class_id',c.id).eq('nickname',nick).maybeSingle());if(!s)fail('저장된 별명이 없어요. 처음 참여를 선택해 주세요.');}
 else {for(let i=0;i<1000;i++){const r=await db.from('du_students').insert({class_id:c.id,nickname:i?`${nick}${i+1}`:nick}).select().single();if(!r.error){s=r.data;break;}if(r.error.code!=='23505')checked(r);}if(!s)fail('다른 별명을 사용해 주세요.');}
 return reply({token:await session('student',s.id),...await studentState(s.id)});
 }
 const auth=await own(req.headers.get('x-session')||'');
 if(action==='logout'){checked(await db.from('du_sessions').delete().eq('token_hash',auth.token_hash));return reply({ok:true});}
 if(auth.role==='teacher'){
 if(action==='classes')return reply({classes:checked(await db.from('du_classes').select('*').order('created_at',{ascending:false}))});
 if(action==='create_class'){if(!['elementary','middle'].includes(b.level))fail('난이도를 선택해 주세요.');const name=text(b.school_name||'',60);for(let i=0;i<80;i++){const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%9000+1000);const r=await db.from('du_classes').insert({code,level:b.level,school_name:name}).select().single();if(!r.error)return reply({classroom:r.data});if(r.error.code!=='23505')checked(r);}fail('수업코드를 만들지 못했어요.');}
 if(action==='board'){if(!uuid(b.class_id))fail('수업을 선택해 주세요.');return reply(await board(b.class_id,true));}
 if(action==='delete_class'){if(!uuid(b.class_id))fail('수업을 선택해 주세요.');const c=checked(await db.from('du_classes').select('code').eq('id',b.class_id).single());if(b.confirm_code!==c.code)fail('삭제할 수업코드를 입력해 주세요.');checked(await db.from('du_classes').delete().eq('id',b.class_id));return reply({ok:true});}
 return reply({error:'지원하지 않는 교사 요청입니다.'},400);
 }
 const sid=auth.student_id;
 if(action==='state')return reply(await studentState(sid));
 if(action==='save_answer'){
 if(!Number.isInteger(b.case_no)||b.case_no<1||b.case_no>4)fail('사건 번호를 확인해 주세요.');
 if(!Array.isArray(b.found_items)||b.found_items.length>30||b.found_items.some((x:any)=>typeof x!=='string'||x.length>60))fail('찾은 항목을 확인해 주세요.');
 if(!b.choices||typeof b.choices!=='object'||Array.isArray(b.choices)||JSON.stringify(b.choices).length>10000)fail('선택 내용을 확인해 주세요.');
 checked(await db.from('du_answers').upsert({student_id:sid,case_no:b.case_no,found_items:[...new Set(b.found_items)],choices:b.choices,reason:text(b.reason||'',500),completed:b.completed===true,updated_at:new Date().toISOString()},{onConflict:'student_id,case_no'}));
 return reply({ok:true});
 }
 if(action==='progress'){if(!Number.isInteger(b.current_case)||b.current_case<1||b.current_case>5||!Number.isInteger(b.current_step)||b.current_step<0||b.current_step>30)fail('진행 위치를 확인해 주세요.');checked(await db.from('du_students').update({current_case:b.current_case,current_step:b.current_step}).eq('id',sid));return reply({ok:true});}
 if(action==='save_card'){
 const st=b.stamp;if(!st||!['hatch','grid','wave','dot','brick'].includes(st.pattern)||!['none','lock','eraser','shield'].includes(st.icon)||!['rect','round'].includes(st.shape)||!Number.isFinite(st.density)||st.density<10||st.density>95)fail('도장 설정을 확인해 주세요.');
 if(![st.width,st.height,st.margin].every(Number.isFinite)||st.width<15||st.width>80||st.height<10||st.height>50||st.margin<0||st.margin>5)fail('출력 크기를 확인해 주세요.');
 const safe={pattern:st.pattern,icon:st.icon,shape:st.shape,density:st.density,width:st.width,height:st.height,margin:st.margin,coverage:Number.isFinite(st.coverage)?Math.max(0,Math.min(100,st.coverage)):0};
 const card=checked(await db.from('du_cards').upsert({student_id:sid,surprise:text(b.surprise),promise:text(b.promise),job_thought:text(b.job_thought||''),stamp:safe},{onConflict:'student_id'}).select().single());return reply({card});}
 if(action==='class_summary'||action==='gallery'){const s=checked(await db.from('du_students').select('class_id').eq('id',sid).single());return reply(await board(s.class_id,false));}
 if(action==='vote'){if(!uuid(b.card_id))fail('도장을 선택해 주세요.');const c=checked(await db.from('du_cards').select('student_id').eq('id',b.card_id).single());if(c.student_id===sid)fail('친구의 도장을 골라 주세요.');const both=checked(await db.from('du_students').select('class_id').in('id',[sid,c.student_id]));if(both.length!==2||both[0].class_id!==both[1].class_id)fail('같은 수업의 도장만 선택할 수 있어요.');checked(await db.from('du_votes').upsert({student_id:sid,card_id:b.card_id},{onConflict:'student_id'}));return reply({ok:true});}
 return reply({error:'지원하지 않는 요청입니다.'},400);
 }catch(e){return reply({error:e instanceof Error?e.message:'잠시 후 다시 해 주세요.'},400);}
});
