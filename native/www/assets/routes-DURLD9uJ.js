import{f as e,l as t,r as n}from"./useRouter-CYijDE91.js";import{t as r}from"./link-DWJ98Qvg.js";import{n as i}from"./client-ClUE2Mst.js";import{t as a}from"./createLucideIcon-CUlC3XCC.js";import{t as o}from"./arrow-right-O04_xOos.js";import{t as ee}from"./SiteHeader-jgvrZ8e5.js";import{t as s}from"./book-open-Dt7P0k7U.js";import{t as c}from"./clock-BL6S6Cql.js";import{t as l}from"./eye-off-BYdlcDQc.js";import{t as u}from"./eye-DytjH5Zn.js";import{t as te}from"./SiteFooter-DyQ6Uv_1.js";import{t as ne}from"./heart-pulse-BnPjQTyY.js";import{t as d}from"./repeat-B9Ysp5bI.js";import{t as f}from"./shield-check-hY1u1nW1.js";import{t as p}from"./target-DdWs7LRE.js";import{m as re}from"./useOnlineStatus-Cqz6G9Mh.js";import{$ as ie,Dt as m,Et as h,O as g,Ot as _,Q as ae,X as v,Y as oe,Yt as se,Z as y,bt as b,et as ce,ft as le,it as ue,lt as x,nt as S,ot as de,tt as C,wt as fe}from"./index-DQ8e_DT0.js";import{t as w}from"./input-B607HJAk.js";import{t as T}from"./label-BC5tyl5s.js";var pe=a(`apple`,[[`path`,{d:`M12 6.528V3a1 1 0 0 1 1-1h0`,key:`11qiee`}],[`path`,{d:`M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21`,key:`110c12`}]]),me=a(`monitor`,[[`rect`,{width:`20`,height:`14`,x:`2`,y:`3`,rx:`2`,key:`48i651`}],[`line`,{x1:`8`,x2:`16`,y1:`21`,y2:`21`,key:`1svkeh`}],[`line`,{x1:`12`,x2:`12`,y1:`17`,y2:`21`,key:`vw1qmm`}]]),E=e(t()),he=`/assets/hero-squat-camera-Cw2BI1_G.jpg`,D=n();function O(){let e=se(),{freeAccessMode:t}=re();x();let[n,a]=(0,E.useState)(`intro`),[l,u]=(0,E.useState)(``),[O,N]=(0,E.useState)(``),[P,F]=(0,E.useState)(``),[I,L]=(0,E.useState)(``),[R,z]=(0,E.useState)(``),[B,V]=(0,E.useState)(!1),[H,U]=(0,E.useState)(!1),[W,G]=(0,E.useState)(!1),[K,q]=(0,E.useState)(!1),[J,Y]=(0,E.useState)(!1),[_e,X]=(0,E.useState)(!1),[Z,Q]=(0,E.useState)(null);(0,E.useEffect)(()=>{let t=typeof window<`u`?new URLSearchParams(window.location.search):null,n=t?.get(`auth`)??null;if(n===`signin`||n===`signup`){Q(ge(t?.get(`next`))),a(n),window.history.replaceState(null,``,`/`);return}C(ce())&&e({to:`/app`}),S().then(t=>{C(t)&&e({to:`/app`})}).catch(()=>void 0)},[e]),(0,E.useEffect)(()=>{let e=()=>{a(`intro`),z(``),G(!1),q(!1),Y(!1),X(!1)};return window.addEventListener(`smartymove:home`,e),()=>window.removeEventListener(`smartymove:home`,e)},[]);async function ve(t){if(t.preventDefault(),!(!l||!O||!P||!I)){z(``),q(!1),Y(!1),X(!1),V(!0);try{let t=await de(l,O,Number(P),I,k(Z));if(t.emailVerificationRequired){q(!0);return}let n=ae();oe();let r={...t.user,parq:t.user.parq??n.parq,questionnaire:t.user.questionnaire??n.questionnaire,goal:t.user.goal??n.goal},i=Z??(C(r)?ie(`/app/screen`):y(r)??`/app/screen`);C(r)&&v(),e({to:i})}catch(e){z(e instanceof Error?e.message:`Account creation failed. Try again.`)}finally{V(!1)}}}async function ye(t){if(t.preventDefault(),!(!O||!I)){z(``),X(!1),Y(!1),V(!0);try{let t=await ue(O,I),n=Z??(C(t)?`/app`:y(t)??`/app`);C(t)&&v(),e({to:n})}catch(e){let t=e instanceof Error?e.message:`Sign in failed. Check your email and password.`;if(typeof navigator<`u`&&navigator.onLine===!1||/failed to fetch|network|load failed|fetch failed/i.test(t)){let e=await le(O,I);if(e===`ok`){window.location.href=Z??`/app`;return}z(e===`bad-password`?`That password doesn't match the one saved on this device.`:`You're offline and this device has no saved sign-in yet. Connect once and sign in, then it will work offline.`);return}if(/email not (confirmed|verified)/i.test(t)){X(!0),z(`Please verify your email before signing in. Check your inbox, or resend the verification email below.`);return}z(t)}finally{V(!1)}}}async function $(){if(O){z(``),Y(!1),V(!0);try{let{error:e}=await i.auth.resend({type:`signup`,email:O.trim().toLowerCase(),options:{emailRedirectTo:k(Z)}});if(e)throw e;Y(!0),q(!0),X(!1)}catch(e){z(e instanceof Error?e.message:`Couldn't resend the verification email.`)}finally{V(!1)}}}async function be(e){if(e.preventDefault(),O){z(``),V(!0);try{let{error:e}=await i.auth.resetPasswordForEmail(O.trim().toLowerCase(),{redirectTo:`${window.location.origin}/reset-password`});if(e)throw e;G(!0)}catch(e){z(e instanceof Error?e.message:`Couldn't send reset email.`)}finally{V(!1)}}}return(0,D.jsxs)(`div`,{className:`flex min-h-[100dvh] w-full flex-col`,children:[(0,D.jsx)(ee,{onSignIn:()=>a(`signin`),onSignUp:()=>a(`signup`),onBack:n===`intro`?void 0:()=>a(`intro`)}),(0,D.jsxs)(`main`,{className:`mx-auto w-full flex-1 pb-6 pt-5 ${n===`intro`?`px-5 max-w-[430px] lg:max-w-[1080px] lg:px-6 lg:pt-16 lg:pb-20`:`px-5 max-w-[420px]`}`,children:[n===`intro`?(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`section`,{className:`relative left-1/2 -mt-5 mb-4 hidden h-[280px] w-screen -translate-x-1/2 overflow-hidden lg:-mt-16 lg:mb-14 lg:block lg:h-auto`,children:[(0,D.jsx)(`img`,{src:he,alt:`Man performing a squat in front of a phone camera running a movement scan`,width:1920,height:1088,decoding:`async`,className:`absolute inset-0 h-full w-full object-cover object-[68%_center]`}),(0,D.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/25`}),(0,D.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-t from-[#050B16] via-[#050B16]/25 to-transparent`}),(0,D.jsx)(`div`,{className:`relative mx-auto hidden w-full max-w-[430px] px-5 py-16 lg:block lg:max-w-[1080px] lg:px-6 lg:py-36`,children:(0,D.jsxs)(`div`,{className:`max-w-xl`,children:[(0,D.jsxs)(`h1`,{className:`text-[38px] font-extrabold leading-[1.05] tracking-tight text-white lg:text-[60px]`,children:[`Know how you move,`,(0,D.jsx)(`br`,{}),(0,D.jsx)(`span`,{className:`text-primary`,children:`move smarter.`})]}),(0,D.jsx)(`p`,{className:`mt-5 text-base leading-relaxed text-white/80 lg:mt-6 lg:text-lg`,children:`Run a camera-based Movement Screen. Get your Movement Score, Movement Age, and a personalized 2-week corrective program — built around your real mobility limits.`}),(0,D.jsxs)(`div`,{className:`mt-7 flex flex-wrap items-center gap-3`,children:[(0,D.jsx)(`button`,{onClick:()=>e({to:`/onboarding/parq`}),className:`h-12 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground hover:opacity-95`,children:`Get started`}),(0,D.jsx)(r,{to:`/how-it-works`,className:`inline-flex h-12 items-center rounded-full border-2 border-primary px-8 text-base font-bold text-primary hover:bg-primary/10`,children:`How it works`})]}),!t&&(0,D.jsx)(`p`,{className:`mt-4 text-sm text-white/60`,children:`One-time €9.99 per scan. No subscription.`})]})})]}),(0,D.jsxs)(`div`,{className:`lg:hidden`,children:[(0,D.jsxs)(`section`,{className:`py-4 text-center`,children:[(0,D.jsxs)(`h1`,{className:`text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-foreground`,children:[`Know how you move,`,(0,D.jsx)(`br`,{}),(0,D.jsx)(`span`,{className:`text-primary`,children:`move smarter.`})]}),(0,D.jsx)(`p`,{className:`mx-auto mt-5 max-w-[22rem] text-[15px] leading-relaxed text-muted-foreground`,children:`Run a camera-based Movement Screen. Get your Movement Score, Movement Age, and a personalized 2-week corrective program — built around your real mobility limits.`}),(0,D.jsxs)(`div`,{className:`mx-auto mt-8 flex max-w-xs flex-col gap-3`,children:[(0,D.jsxs)(`button`,{onClick:()=>e({to:`/onboarding/parq`}),className:`flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-[16px] font-extrabold text-primary-foreground`,children:[(0,D.jsx)(m,{className:`h-4 w-4 shrink-0`}),`Get started`]}),(0,D.jsx)(r,{to:`/how-it-works`,className:`flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-primary text-[16px] font-bold text-primary no-underline`,style:{textDecoration:`none`},children:`How it works`})]}),!t&&(0,D.jsx)(`p`,{className:`mx-auto mt-5 max-w-[22rem] text-[12px] leading-snug text-muted-foreground/70`,children:`One-time €9.99 per scan. No subscription.`})]}),(0,D.jsxs)(`div`,{className:`sm-wellness-grid`,children:[(0,D.jsx)(`div`,{className:`sm-panel-score-picture sm-border-score`,children:(0,D.jsxs)(`div`,{className:`sm-score-card`,children:[(0,D.jsx)(`div`,{children:`Movement Score`}),(0,D.jsxs)(`strong`,{children:[`72`,(0,D.jsx)(`small`,{children:`/100`})]}),(0,D.jsx)(`p`,{children:`Movement Age 41 · Chronological 47`})]})}),(0,D.jsxs)(`section`,{className:`sm-panel sm-panel-about sm-border-about`,children:[(0,D.jsxs)(`div`,{className:`sm-card-topline`,children:[(0,D.jsx)(`span`,{}),` Assess `,(0,D.jsx)(A,{Icon:_})]}),(0,D.jsxs)(`h2`,{children:[`Smarty `,(0,D.jsx)(`span`,{children:`Move`})]}),(0,D.jsx)(`p`,{children:`Your pocket movement coach. Use your phone, tablet, laptop, or desktop camera for a guided movement screen — get your Movement Score, Movement Age, and a 5-minute daily corrective workout built around what your body actually needs.`}),(0,D.jsxs)(`div`,{className:`sm-feature-list`,children:[(0,D.jsx)(j,{Icon:m,color:`#2C99B3`,title:`Camera movement scan`,text:`Guided patterns, any camera.`}),(0,D.jsx)(j,{Icon:f,color:`#43AD5C`,title:`Private by design`,text:`Runs on your device.`}),(0,D.jsx)(j,{Icon:c,color:`#FF8A4C`,title:`5-minute daily routine`,text:`Short corrective work.`}),(0,D.jsx)(j,{Icon:p,color:`#7A3EBA`,title:`Personalized focus areas`,text:`Built on your real limits.`}),(0,D.jsx)(j,{Icon:d,color:`#38A5C7`,title:`Retest every 14 days`,text:`Program evolves with you.`}),(0,D.jsx)(j,{Icon:me,color:`#4FB286`,title:`Works on any screen`,text:`Phone, tablet, or laptop.`}),(0,D.jsx)(j,{Icon:h,color:`#3B82F6`,title:`Progress you can see`,text:`Score history and trends.`}),(0,D.jsx)(j,{Icon:ne,color:`#E46B5A`,title:`Built on movement science`,text:`Functional screening roots.`}),(0,D.jsx)(j,{Icon:b,color:`#F59E0B`,title:`Small wins, daily`,text:`A habit that lasts.`})]}),(0,D.jsxs)(r,{to:`/about`,className:`sm-text-link`,children:[`Learn more about Smarty Move `,(0,D.jsx)(o,{className:`h-4 w-4`})]})]}),(0,D.jsxs)(`section`,{className:`sm-panel sm-panel-tools sm-border-tools`,children:[(0,D.jsxs)(`div`,{className:`sm-card-topline`,children:[(0,D.jsx)(`span`,{}),` Routine `,(0,D.jsx)(A,{Icon:pe})]}),(0,D.jsxs)(`h2`,{children:[`Daily `,(0,D.jsx)(`span`,{children:`Correctives`})]}),(0,D.jsx)(`p`,{children:`Mobility, stability, and strength exercises selected from curated coach-built libraries for your body’s top priority areas.`}),(0,D.jsxs)(`div`,{className:`sm-feature-list`,children:[(0,D.jsx)(j,{Icon:_,color:`#2C99B3`,title:`Mobility focus`,text:`Restore range of motion.`}),(0,D.jsx)(j,{Icon:f,color:`#43AD5C`,title:`Stability focus`,text:`Control around key joints.`}),(0,D.jsx)(j,{Icon:fe,color:`#FF8A4C`,title:`Strength focus`,text:`Low-load, clean movement.`}),(0,D.jsx)(j,{Icon:s,color:`#7A3EBA`,title:`Curated exercise library`,text:`Coach-built by body area.`}),(0,D.jsx)(j,{Icon:d,color:`#38A5C7`,title:`Evolves with you`,text:`Updates after each retest.`})]}),(0,D.jsxs)(r,{to:`/learn`,className:`sm-text-link`,children:[`Learn how the program works `,(0,D.jsx)(o,{className:`h-4 w-4`})]})]})]})]}),(0,D.jsx)(`div`,{className:`hidden lg:block`,children:(0,D.jsxs)(`div`,{className:`rounded-[32px] border-2 border-primary bg-card p-12`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,D.jsxs)(`div`,{className:`flex-1 inline-flex items-center gap-3 rounded-full border-2 border-primary/40 px-6 py-3`,children:[(0,D.jsx)(b,{className:`h-4 w-4 text-primary`}),(0,D.jsx)(`span`,{className:`text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary`,children:`HOW IT WORKS`})]}),(0,D.jsx)(`div`,{className:`grid place-items-center h-14 w-14 rounded-full border-2 border-primary/40 bg-primary/5`,children:(0,D.jsx)(b,{className:`h-6 w-6 text-primary`})})]}),(0,D.jsxs)(`h2`,{className:`mt-10 text-[34px] leading-tight font-extrabold text-[#0f172a]`,children:[`From scan `,(0,D.jsx)(`span`,{className:`text-primary`,children:`to program.`})]}),(0,D.jsx)(`p`,{className:`mt-3 text-slate-500`,children:t?`Three steps. Scan, get your plan, train.`:`Three steps. One payment. No subscription.`}),(0,D.jsxs)(`div`,{className:`mt-10 grid grid-cols-3 gap-10`,children:[(0,D.jsxs)(`div`,{className:`text-center`,children:[(0,D.jsx)(`div`,{className:`text-[64px] leading-none font-extrabold text-orange-500`,children:`1`}),(0,D.jsx)(`div`,{className:`mt-3 text-lg font-bold text-[#0f172a]`,children:`Scan`}),(0,D.jsx)(`p`,{className:`mt-1 text-sm text-slate-500`,children:`Run the 5-pattern Movement Screen with any camera.`})]}),(0,D.jsxs)(`div`,{className:`text-center`,children:[(0,D.jsx)(`div`,{className:`text-[64px] leading-none font-extrabold text-blue-500`,children:`2`}),(0,D.jsx)(`div`,{className:`mt-3 text-lg font-bold text-[#0f172a]`,children:`Score`}),(0,D.jsx)(`p`,{className:`mt-1 text-sm text-slate-500`,children:`Get your Movement Score, Movement Age, and priority areas.`})]}),(0,D.jsxs)(`div`,{className:`text-center`,children:[(0,D.jsx)(`div`,{className:`text-[64px] leading-none font-extrabold text-emerald-500`,children:`3`}),(0,D.jsx)(`div`,{className:`mt-3 text-lg font-bold text-[#0f172a]`,children:`Train`}),(0,D.jsx)(`p`,{className:`mt-1 text-sm text-slate-500`,children:`Follow a personalized 5-min daily corrective program.`})]})]}),(0,D.jsxs)(`div`,{className:`mt-12 border-t border-slate-200 pt-10`,children:[(0,D.jsx)(`h3`,{className:`text-center text-2xl font-extrabold text-[#0f172a]`,children:`What's included`}),(0,D.jsx)(`div`,{className:`mt-6 grid grid-cols-2 gap-x-10 gap-y-4`,children:[{Icon:m,label:`Camera movement scan`},{Icon:b,label:`Movement Score & Movement Age`},{Icon:p,label:`Personalized focus areas`},{Icon:c,label:`5-minute daily corrective routine`},{Icon:d,label:`Retest every 14 days`},{Icon:h,label:`Progress history you keep forever`},{Icon:s,label:`Curated coach-built exercise library`},{Icon:f,label:`Private by design — runs on your device`}].map(({Icon:e,label:t})=>(0,D.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,D.jsx)(`span`,{className:`grid place-items-center h-8 w-8 rounded-full border-2 border-primary/40 bg-primary/5`,children:(0,D.jsx)(e,{className:`h-4 w-4 text-primary`})}),(0,D.jsx)(`span`,{className:`text-[15.5px] font-semibold text-[#0f172a]`,children:t})]},t))})]})]})})]}):n===`signup`?(0,D.jsxs)(`form`,{onSubmit:ve,className:`mt-2 flex flex-col gap-3`,children:[(0,D.jsx)(`h2`,{style:{fontWeight:800,fontSize:24,color:`#14213A`,letterSpacing:`-0.01em`},children:`Create your account`}),(0,D.jsx)(`p`,{className:`-mt-1 text-sm`,style:{color:`#6B7A90`},children:`Saved securely to your account.`}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`n`,children:`Name`}),(0,D.jsx)(w,{id:`n`,value:l,onChange:e=>u(e.target.value),required:!0,className:`h-11 rounded-xl`})]}),(0,D.jsxs)(`div`,{className:`grid grid-cols-[1fr_90px] gap-3`,children:[(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`e`,children:`Email`}),(0,D.jsx)(w,{id:`e`,type:`email`,value:O,onChange:e=>N(e.target.value),required:!0,className:`h-11 rounded-xl`})]}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`a`,children:`Age`}),(0,D.jsx)(w,{id:`a`,type:`number`,min:12,max:100,value:P,onChange:e=>F(e.target.value?Number(e.target.value):``),required:!0,className:`h-11 rounded-xl`})]})]}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`p`,children:`Password`}),(0,D.jsx)(M,{id:`p`,value:I,onChange:L,show:H,onToggle:()=>U(e=>!e)})]}),K&&(0,D.jsxs)(`div`,{className:`rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm`,style:{color:`#14213A`},children:[(0,D.jsx)(`strong`,{children:`Verify your email to continue.`}),(0,D.jsxs)(`p`,{className:`mt-1`,style:{color:`#6B7A90`},children:[`We sent a verification link to `,O.trim().toLowerCase(),`. You cannot buy a scan or enter the app until that email is verified.`]})]}),(0,D.jsx)(g,{type:`submit`,disabled:B||K,style:{background:`#FF6B4A`,boxShadow:`0 14px 24px -10px rgba(255,107,74,0.55)`},className:`mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95`,children:K?`Check your email`:B?`Saving...`:`Continue`}),K&&(0,D.jsx)(`button`,{type:`button`,onClick:$,disabled:B||J,className:`text-center text-sm font-semibold disabled:opacity-60`,style:{color:`#0E7C86`},children:J?`Verification email resent ✓`:`Resend verification email`}),R&&(0,D.jsx)(`p`,{className:`text-center text-sm font-semibold text-destructive`,children:R}),_e&&(0,D.jsx)(`button`,{type:`button`,onClick:$,disabled:B||J,className:`text-center text-sm font-semibold disabled:opacity-60`,style:{color:`#0E7C86`},children:J?`Verification email resent ✓`:`Resend verification email`}),(0,D.jsxs)(`p`,{className:`mt-1 text-center text-sm`,style:{color:`#6B7A90`},children:[`Have an account?`,` `,(0,D.jsx)(`button`,{type:`button`,onClick:()=>a(`signin`),style:{color:`#0E7C86`,fontWeight:700,background:`none`,border:`none`,cursor:`pointer`,padding:0},children:`Sign in`})]})]}):n===`signin`?(0,D.jsxs)(`form`,{onSubmit:ye,className:`mt-2 flex flex-col gap-3`,children:[(0,D.jsx)(`h2`,{style:{fontWeight:800,fontSize:24,color:`#14213A`,letterSpacing:`-0.01em`},children:`Welcome back`}),(0,D.jsx)(`p`,{className:`-mt-1 text-sm`,style:{color:`#6B7A90`},children:`Sign in to continue your movement journey.`}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`se`,children:`Email`}),(0,D.jsx)(w,{id:`se`,type:`email`,value:O,onChange:e=>N(e.target.value),required:!0,className:`h-11 rounded-xl`})]}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,D.jsx)(T,{htmlFor:`sp`,children:`Password`}),(0,D.jsx)(`button`,{type:`button`,onClick:()=>{z(``),G(!1),a(`forgot`)},style:{color:`#0E7C86`,fontWeight:700,fontSize:13,background:`none`,border:`none`,cursor:`pointer`,padding:0},children:`Forgot password?`})]}),(0,D.jsx)(M,{id:`sp`,value:I,onChange:L,show:H,onToggle:()=>U(e=>!e)})]}),(0,D.jsx)(g,{type:`submit`,disabled:B,style:{background:`#FF6B4A`,boxShadow:`0 14px 24px -10px rgba(255,107,74,0.55)`},className:`mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95`,children:B?`Signing in...`:`Sign in`}),R&&(0,D.jsx)(`p`,{className:`text-center text-sm font-semibold text-destructive`,children:R}),(0,D.jsxs)(`p`,{className:`mt-1 text-center text-sm`,style:{color:`#6B7A90`},children:[`New here?`,` `,(0,D.jsx)(`button`,{type:`button`,onClick:()=>a(`signup`),style:{color:`#0E7C86`,fontWeight:700,background:`none`,border:`none`,cursor:`pointer`,padding:0},children:`Create an account`})]})]}):(0,D.jsxs)(`form`,{onSubmit:be,className:`mt-2 flex flex-col gap-3`,children:[(0,D.jsx)(`h2`,{style:{fontWeight:800,fontSize:24,color:`#14213A`,letterSpacing:`-0.01em`},children:`Reset your password`}),(0,D.jsx)(`p`,{className:`-mt-1 text-sm`,style:{color:`#6B7A90`},children:`Enter your account email. We'll send you a link to set a new password.`}),(0,D.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,D.jsx)(T,{htmlFor:`fe`,children:`Email`}),(0,D.jsx)(w,{id:`fe`,type:`email`,value:O,onChange:e=>N(e.target.value),required:!0,className:`h-11 rounded-xl`})]}),(0,D.jsx)(g,{type:`submit`,disabled:B||W,style:{background:`#FF6B4A`,boxShadow:`0 14px 24px -10px rgba(255,107,74,0.55)`},className:`mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95`,children:W?`Email sent ✓`:B?`Sending...`:`Send reset link`}),W&&(0,D.jsx)(`p`,{className:`text-center text-sm`,style:{color:`#0E7C86`},children:`Check your inbox (and spam folder) for the reset link.`}),R&&(0,D.jsx)(`p`,{className:`text-center text-sm font-semibold text-destructive`,children:R}),(0,D.jsxs)(`p`,{className:`mt-1 text-center text-sm`,style:{color:`#6B7A90`},children:[`Remembered it?`,` `,(0,D.jsx)(`button`,{type:`button`,onClick:()=>{z(``),G(!1),a(`signin`)},style:{color:`#0E7C86`,fontWeight:700,background:`none`,border:`none`,cursor:`pointer`,padding:0},children:`Back to sign in`})]})]}),(0,D.jsx)(`style`,{children:`
          .sm-home-shell{
            position: relative;
          }
          .sm-home-shell::before{
            content:"";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(circle, rgba(20,33,58,.08) 1px, transparent 1px);
            background-size: 18px 18px;
            opacity: .55;
            z-index: -1;
          }
          .sm-wellness-grid{
            display: grid;
            gap: 14px;
          }
          .sm-panel{
            background: rgba(255,255,255,.94);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 12px 36px -28px rgba(20,33,58,.45);
            transition: transform .2s ease, box-shadow .2s ease;
            will-change: transform;
          }
          .sm-panel:hover{
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px -20px rgba(20,33,58,.35);
          }
          .sm-border-score{ border: 1.5px solid #43AD5C; }
          .sm-border-mobile{ border: 1.5px solid #FF8A4C; }
          .sm-border-about{ border: 1.5px solid #7A3EBA; }
          .sm-border-program{ border: 1.5px solid #2C99B3; }
          .sm-border-tools{ border: 1.5px solid #F59E0B; }
          .sm-panel-score-picture{
            transition: transform .2s ease, box-shadow .2s ease;
            will-change: transform;
          }
          .sm-panel-score-picture:hover{
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px -20px rgba(20,33,58,.35);
          }
          .sm-eyebrow{
            width: fit-content;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #A5DDF4;
            border-radius: 999px;
            color: #2C99B3;
            background: #F7FCFE;
            padding: 4px 9px;
            font-size: 9px;
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: .18em;
            font-weight: 800;
          }
          .sm-panel h2{
            color: #10213F;
            font-size: 22px;
            line-height: 1.05;
            font-weight: 900;
            margin: 14px 0 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sm-panel h2 span{ color: #2B8FA3; }
          .sm-panel p{
            color: #4A5971;
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
          }
          .sm-panel-hero{
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .sm-wellness-title{
            margin: 14px 0 0;
            color: #10213F;
            font-size: 32px;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: 0;
          }
          .sm-wellness-title span{ display:block; white-space:nowrap; }
          .sm-wellness-title span:nth-child(1){ color:#43AD5C; }
          .sm-wellness-title span:nth-child(2){ color:#2B8FA3; }
          .sm-hero-motto{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            color: #4A5971;
            font-size: 14px;
            font-weight: 700;
          }
          .sm-hero-motto svg{ color: #2B8FA3; }
          .sm-read-more-link{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 10px;
            color: #1D7E95;
            font-size: 13px;
            font-weight: 800;
            text-decoration: none;
          }
          .sm-read-more-link:hover{ color: #156578; }
          .sm-read-more-link svg{ color: #2B8FA3; }

          .sm-panel-mobile{
            min-height: 200px;
            display:flex;
            flex-direction:column;
            align-items:flex-start;
          }
          .sm-panel-mobile .sm-primary-cta{ margin-top:auto; }
          .sm-primary-cta{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 38px;
            border: 1px solid #8FD4EA;
            border-radius: 999px;
            background: #F7FCFE;
            color: #1D7E95;
            padding: 0 16px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 18px -14px rgba(44,153,179,.7);
          }
          .sm-card-topline{
            display:flex;
            align-items:center;
            gap: 8px;
            color:#78BED8;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .2em;
            font-weight:800;
          }
          .sm-card-topline > span{
            display:block;
            width:22px;
            height:1px;
            background:#A5DDF4;
          }
          .sm-card-icon{
            margin-left:auto;
            display:grid;
            height:28px;
            width:28px;
            place-items:center;
            border-radius: 9px;
            color:#2C99B3;
            background:#F0FBFF;
            border:1px solid #A5DDF4;
          }
          .sm-panel-about,
          .sm-panel-tools,
          .sm-panel-score-picture{ min-height: 240px; }
          .sm-panel-about{
            display: flex;
            flex-direction: column;
          }
          .sm-panel-about .sm-feature-list{ flex: 1 0 auto; }
          .sm-panel-about .sm-text-link{ margin-top: auto; }
          .sm-panel-tools{ display:flex; flex-direction:column; }
          .sm-panel-tools .sm-feature-list{ flex:1 0 auto; }
          .sm-panel-tools .sm-text-link{ margin-top:auto; }
          .sm-panel-score-picture{
            border-radius: 15px;
            overflow: hidden;
            display: flex;
            box-shadow: 0 12px 36px -28px rgba(20,33,58,.45);
          }
          .sm-panel-score-picture .sm-score-card{
            flex: 1;
            min-height: 0;
            margin-top: 0;
            border-radius: 15px;
          }
          .sm-feature-list{
            display:grid;
            gap:10px;
            margin-top:18px;
          }
          .sm-feature-line{
            display:grid;
            grid-template-columns: 32px minmax(0,1fr);
            gap:10px;
            align-items:start;
          }
          .sm-feature-line-icon,
          .sm-mini-icon{
            display:grid;
            place-items:center;
            border-radius:10px;
          }
          .sm-feature-line-icon{ width:32px; height:32px; }
          .sm-feature-line strong{
            display:block;
            color:#10213F;
            font-size:14px;
            line-height:1.3;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .sm-feature-line small{
            display:block;
            color:#5F6E84;
            font-size:13px;
            line-height:1.35;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .sm-text-link{
            display:inline-flex;
            align-items:center;
            gap:7px;
            color:#1D7E95;
            text-decoration:none;
            font-size:14px;
            font-weight:800;
            margin-top:18px;
          }
          .sm-score-card{
            margin-top:18px;
            border-radius:14px;
            background: linear-gradient(160deg,#F7FCFE 0%, #E6F5F5 100%);
            color:#10213F;
            min-height:180px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            text-align:center;
            overflow:hidden;
            position:relative;
            border: 1px solid #A5DDF4;
          }
          .sm-score-card::before{
            content:"";
            position:absolute;
            left:16px;
            right:16px;
            top:18px;
            height:3px;
            border-radius:99px;
            background:linear-gradient(90deg, transparent, #43AD5C 24%, #7CFFB8 50%, #43AD5C 76%, transparent);
            box-shadow:0 0 16px 3px rgba(79,178,134,.72);
            animation: sm-score-pulse 2.4s ease-in-out infinite;
          }
          @keyframes sm-score-pulse{
            0%,100%{
              opacity:.5;
              box-shadow:0 0 8px 1px rgba(79,178,134,.35);
              transform:translateY(0) scaleX(.9);
            }
            50%{
              opacity:1;
              box-shadow:0 0 24px 6px rgba(124,255,184,.95);
              transform:translateY(4px) scaleX(1);
            }
          }
          .sm-score-card div{
            color:rgba(16,33,63,.62);
            font-size:10px;
            text-transform:uppercase;
            letter-spacing:.16em;
            font-weight:800;
          }
          .sm-score-card strong{
            font-size:56px;
            line-height:1;
            font-weight:900;
            margin-top:5px;
          }
          .sm-score-card small{
            color:rgba(16,33,63,.52);
            font-size:16px;
          }
          .sm-score-card p{
            color:rgba(16,33,63,.78);
            font-size:12px;
            margin-top:8px;
          }
          .dark .sm-score-card{
            background: linear-gradient(160deg,#10213F 0%, #0C1729 100%);
            color:#fff;
            border-color: transparent;
          }
          .dark .sm-score-card div{ color:rgba(255,255,255,.62); }
          .dark .sm-score-card small{ color:rgba(255,255,255,.52); }
          .dark .sm-score-card p{ color:rgba(255,255,255,.78); }
          @media (max-width: 1023px){
            .sm-wellness-grid{ gap:12px; }
            .sm-panel{ padding:18px; }
            .sm-panel-hero{ min-height:190px; }
            .sm-wellness-title{ font-size: 28px; }
            .sm-primary-cta{ width:100%; margin-top:18px; min-height:46px; font-size:14px; }

            .sm-panel-score-picture{ min-height: 190px; }
            .sm-panel-about,
            .sm-panel-tools{ display: none; }
          }
          @media (min-width: 1024px){
            .sm-wellness-grid{ grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: auto 1fr; gap:16px; }
            .sm-panel-hero{ grid-column: 1 / span 6; grid-row: 1; min-height: 200px; }
            .sm-panel-mobile{ grid-column: 7 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-score-picture{ grid-column: 10 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-about{ grid-column: 1 / span 8; grid-row: 2; min-height: 420px; }
            .sm-panel-tools{ grid-column: 9 / span 4; grid-row: 2; min-height: 420px; }
            .sm-panel-about .sm-feature-list{ grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
            .sm-panel h2{ font-size: 22px; }
          }
        `})]}),(0,D.jsx)(te,{})]})}function ge(e){if(!e)return null;try{let t=decodeURIComponent(e);return!t.startsWith(`/`)||t.startsWith(`//`)||t.includes(`\\`)?null:t}catch{return null}}function k(e){if(!(typeof window>`u`))return e?`${window.location.origin}/?auth=signin&next=${encodeURIComponent(e)}`:window.location.origin}function A({Icon:e}){return(0,D.jsx)(`span`,{className:`sm-card-icon`,children:(0,D.jsx)(e,{className:`h-4 w-4`,strokeWidth:2.2})})}function j({Icon:e,color:t,title:n,text:r}){return(0,D.jsxs)(`div`,{className:`sm-feature-line`,children:[(0,D.jsx)(`span`,{className:`sm-feature-line-icon`,style:{background:`${t}18`,color:t},children:(0,D.jsx)(e,{className:`h-4 w-4`,strokeWidth:2.4})}),(0,D.jsxs)(`span`,{children:[(0,D.jsx)(`strong`,{children:n}),(0,D.jsx)(`small`,{children:r})]})]})}function M({id:e,value:t,onChange:n,show:r,onToggle:i}){return(0,D.jsxs)(`div`,{className:`relative`,children:[(0,D.jsx)(w,{id:e,type:r?`text`:`password`,value:t,onChange:e=>n(e.target.value),required:!0,minLength:6,className:`h-11 rounded-xl pr-11`}),(0,D.jsx)(`button`,{type:`button`,onClick:i,"aria-label":r?`Hide password`:`Show password`,className:`absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground`,tabIndex:-1,children:r?(0,D.jsx)(l,{size:18}):(0,D.jsx)(u,{size:18})})]})}export{O as component};