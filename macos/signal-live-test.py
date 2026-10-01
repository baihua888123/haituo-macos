import pathlib,tempfile,subprocess,os,signal
app=pathlib.Path('macos/out/海拓-darwin-arm64/海拓.app/Contents/MacOS/海拓').resolve()
out=pathlib.Path('macos/live').resolve();out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(prefix='haituo-signal-live-') as profile:
 env={**os.environ,'HAITUO_SIGNAL_LIVE_TEST':'1','HAITUO_SIGNAL_LIVE_DIR':str(out)}
 with (out/'client.log').open('w') as log:
  proc=subprocess.Popen([str(app),'--user-data-dir='+profile],env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  try:proc.wait(timeout=1250)
  finally:
   try:os.killpg(proc.pid,signal.SIGKILL)
   except ProcessLookupError:pass
