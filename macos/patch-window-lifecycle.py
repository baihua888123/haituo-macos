from pathlib import Path
root=Path('macos/staging/app')
p=root/'bundles/main.js'
s=p.read_text()
def edit(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new,1)
edit('    p.app.disableHardwareAcceleration();','    process.platform !== `darwin` && p.app.disableHardwareAcceleration();')
edit('    let n = Zg, r = n?.id === e && n.width > 0 && n.height > 0;','    let n = Zg, r = n?.id === e && n.width > 0 && n.height > 0;\n    const accountWindowConfig = $p();')
a=s.index('function $g(');b=s.index('\nfunction haituoMacFocusSelectedAccount()',a)
s=s[:a]+s[a:b].replace('$p().','accountWindowConfig.')+s[b:]
edit('e.visible && Qg?.visible && Z && (!Z.isVisible() || !caishengNativeFollower || caishengNativeFollower.killed) && n_();','e.visible && Qg?.visible && Z && (!Z.isVisible() || process.platform === `win32` && (!caishengNativeFollower || caishengNativeFollower.killed)) && n_();')
edit('function C_() {\n    if (!Z || Z.isDestroyed()) return;','''function C_() {
    if (!Z || Z.isDestroyed()) return;
    if (process.platform === `darwin` && $u !== `signal-main`) {
        if (Qg?.visible) haituoMacActivateAccountWindow();
        else Z.hide();
        return;
    }''')
edit('        title: `Haituo Signal ${$u}`','        title: `Haituo Signal ${$u}`,\n        ...(process.platform === `darwin` ? { type: `panel` } : {})')
edit('    if (e.type === `caisheng-focus-account`) {','''    if (e.type === `haituo-test-window-state` && process.env.HAITUO_WINDOW_TEST === `1`) {
        process.send?.({ type: `haituo-test-window-result`, requestId: e.requestId, visible: !!Z?.isVisible(), focused: !!Z?.isFocused(), ready: !!Z, selected: !!Qg?.visible });
        return;
    }
    if (e.type === `caisheng-focus-account`) {''')
edit('            h && (X.info(`showing main window`),','            if (process.env.HAITUO_WINDOW_TEST === `1` && h) setTimeout(haituoTestAccountWindows, 1000);\n            h && (X.info(`showing main window`),')
# A test-only routine uses actual child processes and native BrowserWindows on the Mac runner.
test=Path('macos/account-window-test-hook.js').read_text()
s+='\n'+test
p.write_text(s)
p=root/'bundles/preload/main.js';s=p.read_text()
old='''            let e = r.filter(e => e.platformId === `signal` && e.id !== `signal-main`).map((e, t) => setTimeout(() => {
                window.SignalContext.caishengLaunchSignalProfile(e.id);
            }, 250 + 350 * t));'''
assert s.count(old)==1
s=s.replace(old,'''            if (window.SignalContext.OS.platform === `darwin`) {
                const selected = r.find(e => e.id === o && e.platformId === `signal` && e.id !== `signal-main`);
                selected && window.SignalContext.caishengLaunchSignalProfile(selected.id);
                return;
            }
'''+old,1)
old='''            let e = r.filter(e => e.platformId === `whatsapp` && bCr(e.platformId, t)), n = e.find(e => qLoaded.includes(e.id) && !qReady.includes(e.id));'''
assert s.count(old)==1
s=s.replace(old,'''            if (window.SignalContext.OS.platform === `darwin`) return;
'''+old,1)
p.write_text(s)
print('Applied Mac lazy account loading, panel lifecycle and heartbeat reduction')
