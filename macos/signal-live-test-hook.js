async function haituoSignalLiveTest() {
 if(process.platform!=='darwin'||$u!=='signal-main'||process.env.HAITUO_SIGNAL_LIVE_TEST!=='1')return;
 const dir=process.env.HAITUO_SIGNAL_LIVE_DIR;
 (0,m.mkdirSync)(dir,{recursive:true});
 let running=false,linked=false;
 const poll=async()=>{
  if(running||linked||!Z||Z.isDestroyed())return;
  running=true;
  try{
   const state=await Z.webContents.executeJavaScript(`(()=>{const area=document.querySelector('.CaishengPlatformShell__signal');return {qr:!!area?.querySelector('[class*=InstallScreenQrCodeNotScannedStep]'),inbox:!!area?.querySelector('.inbox'),loading:!!area?.querySelector('.app-loading-screen')}})()`);
   (0,m.writeFileSync)((0,s.join)(dir,'status.json'),JSON.stringify({at:new Date().toISOString(),...state}));
   if(state.qr){const image=await Z.webContents.capturePage();(0,m.writeFileSync)((0,s.join)(dir,'signal-qr.png'),image.toPNG());}
   if(state.inbox){linked=true;console.log('Signal test device linked; no messages inspected');}
  }catch(error){console.error('Signal test capture failed',String(error));}finally{running=false;}
 };
 await poll();setInterval(poll,5000);
 setTimeout(()=>p.app.quit(),20*60*1000);
}
