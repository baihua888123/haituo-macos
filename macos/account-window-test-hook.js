async function haituoTestAccountWindows() {
    if (process.platform !== `darwin` || $u !== `signal-main` || process.env.HAITUO_WINDOW_TEST !== `1`) return;
    const output = process.env.HAITUO_WINDOW_TEST_RESULT;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const launch = p.ipcMain._invokeHandlers.get(`caisheng:launch-signal-profile`);
    const sync = p.ipcMain._invokeHandlers.get(`caisheng:sync-signal-profile`);
    const states = [], ids = [ `signal-haituo-test-a`, `signal-haituo-test-b`, `signal-haituo-test-c` ];
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const state = id => new Promise((resolve, reject) => {
        const child = Yg.get(id), requestId = `${id}-${Date.now()}`;
        const timer = setTimeout(() => { child.removeListener(`message`, listen); reject(Error(`No window state from ${id}`)); }, 10000);
        function listen(value) {
            if (value?.type !== `haituo-test-window-result` || value.requestId !== requestId) return;
            clearTimeout(timer); child.removeListener(`message`, listen); resolve({ id, ...value });
        }
        child.on(`message`, listen);
        caishengSendChild(child, { type: `haituo-test-window-state`, requestId });
    });
    try {
        check(typeof launch === `function` && typeof sync === `function`, `Account handlers unavailable`);
        for (const id of ids) {
            await launch({}, id);
            const deadline = Date.now() + 60000;
            while (!Xg.has(id) && Date.now() < deadline) await delay(200);
            check(Xg.has(id), `Account did not become ready: ${id}`);
            const before = await state(id); states.push({ stage: `background-created`, ...before });
            check(!before.visible, `Unselected account opened a window: ${id}`);
        }
        for (const id of [ids[0], ids[1], ids[2], ids[0]]) {
            sync({}, { id, x: 110, y: 70, width: 700, height: 500, keepVisible: true });
            await delay(700);
            const current = await Promise.all(ids.map(state));
            states.push({ stage: `selected`, selectedId: id, accounts: current });
            check(current.filter(value => value.visible).length === 1, `Expected only one visible account`);
            check(current.find(value => value.id === id)?.visible, `Selected account was hidden`);
        }
        caishengMenuOpen = !0; e_();
        await delay(700);
        const menuHidden = await Promise.all(ids.map(state));
        check(menuHidden.every(value => !value.visible), `Account covered the add-account menu`);
        states.push({ stage: `add-menu-open`, accounts: menuHidden });
        caishengMenuOpen = !1; e_();
        await delay(700);
        check((await state(ids[0])).visible, `Account did not return after menu closed`);
        const overlay = new p.BrowserWindow({ show: false, width: 400, height: 300, parent: Z });
        try {
            haituoRaiseOverlayWindow(overlay);
            await delay(700);
            const overlayHidden = await Promise.all(ids.map(state));
            check(overlayHidden.every(value => !value.visible), `Account covered the settings overlay`);
            states.push({ stage: `overlay-open`, accounts: overlayHidden });
        } finally { overlay.destroy(); }
        await delay(700);
        check((await state(ids[0])).visible, `Account did not return after overlay closed`);
        sync({}, { id: null, x: 110, y: 70, width: 700, height: 500 });
        await delay(700);
        const hidden = await Promise.all(ids.map(state));
        check(hidden.every(value => !value.visible), `Accounts remained visible after switching away`);
        states.push({ stage: `switched-away`, accounts: hidden });
        for (const id of ids) caishengTerminateSignalChild(Yg.get(id));
        (0, m.writeFileSync)(output, JSON.stringify({ ok: true, states }, null, 2));
        p.app.quit();
    } catch (error) {
        for (const id of ids) caishengTerminateSignalChild(Yg.get(id));
        (0, m.writeFileSync)(output, JSON.stringify({ ok: false, error: String(error?.stack || error), states }, null, 2));
        p.app.exit(1);
    }
}
