import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:4173';
const report = process.env.SCREEN_REPORT ?? '/tmp/screen-acceptance.json';
const profile = await mkdtemp(`${tmpdir()}/t151-chrome-`);
const chrome = spawn(
  process.env.CHROME_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
let socket;
try {
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Chrome startup timed out')),
      10000,
    );
    let output = '';
    const failed = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
    chrome.once('error', (error) =>
      failed(new Error('Chrome startup failed', { cause: error })),
    );
    chrome.once('exit', (code) =>
      failed(new Error(`Chrome exited before startup (${code})`)),
    );
    chrome.stderr.on('data', (buffer) => {
      output += buffer.toString();
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });
  socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Chrome connection timed out')),
      10000,
    );
    socket.addEventListener(
      'open',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    socket.addEventListener(
      'error',
      () => {
        clearTimeout(timeout);
        reject(new Error('Chrome connection failed'));
      },
      { once: true },
    );
  });
  let next = 0;
  const pending = new Map();
  socket.addEventListener('close', () => {
    for (const waiter of pending.values())
      waiter.reject(new Error('Chrome connection closed'));
    pending.clear();
  });
  socket.addEventListener('message', (event) => {
    const response = JSON.parse(event.data);
    const waiter = pending.get(response.id);
    if (waiter) {
      pending.delete(response.id);
      response.error
        ? waiter.reject(response.error)
        : waiter.resolve(response.result);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Chrome command timed out: ${method}`));
      }, 10000);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  const { targetId } = await send('Target.createTarget', {
    url: 'about:blank',
  });
  const { sessionId } = await send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  const page = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const result = await page('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw result.exceptionDetails;
    return result.result.value;
  };
  await page('Page.enable');
  const results = [];
  const settle = () =>
    evaluate(
      'document.fonts.ready.then(()=>new Promise(resolve=>setTimeout(resolve,150)))',
    );
  const resize = async (width, height) => {
    await page('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await settle();
  };
  const load = async (story, width = 1280, height = 720) => {
    await resize(width, height);
    await page('Page.navigate', {
      url: `${base}/iframe.html?id=${story}&viewMode=story`,
    });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (
        await evaluate(
          'Boolean(document.querySelector("main, dialog, [data-testid=viewport]"))',
        )
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await settle();
    await evaluate(
      `window.check = (condition,message) => {if(!condition) throw Error(message)};window.element = id => document.querySelector('[data-testid="'+id+'"]');window.shellBody=()=>element('shell').lastElementChild;window.rect=id=>element(id).getBoundingClientRect();`,
    );
  };
  const record = async (scenario, expression) => {
    const result = await evaluate(expression);
    results.push({ scenario, result });
    process.stdout.write(`PASS ${scenario}\n`);
  };
  const key = async (key, code, windowsVirtualKeyCode, modifiers = 0) => {
    await page('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    });
    await page('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    });
    await settle();
  };
  for (const locale of ['english', 'german']) {
    for (const [width, height] of [
      [1920, 1080],
      [1280, 720],
    ]) {
      await load(`layout-screen--representative-${locale}`, width, height);
      await record(
        `representative ${locale} ${width}x${height} initial fit`,
        `(()=>{
        const shell=shellBody(),list=element('list-body'),letter=element('letter-body');
        check(element('heading').textContent==='Harbor Records','fixed Label sample');
        check(element('list-head').textContent===('${locale}'==='english'?'All Messages':'Alle Nachrichten'),'requested locale loaded');
        check(element('letter-head').textContent===('${locale}'==='english'?'Contract offer':'Vertragsangebot'),'localized letter head');
        const footText=element('letter-foot').textContent;
        check(footText.includes('${locale}'==='english'?'This Message needs a Response. It holds Game time.':'Diese Nachricht braucht eine Antwort. Sie hält die Spielzeit an.'),'localized waiting note');
        check(footText.includes('${locale}'==='english'?'Another negotiation is open.':'Eine andere Verhandlung ist offen.'),'localized reason');
        const bounds=['heading','list-head','letter-head','letter-foot'].map(id=>({id,box:(id.endsWith('-head')?element(id).parentElement:element(id)).getBoundingClientRect().toJSON()}));
        const metrics={copy:{heading:element('heading').textContent,list:element('list-head').textContent,head:element('letter-head').parentElement.textContent,foot:footText},bounds,shell:[shell.clientHeight,shell.scrollHeight,shell.scrollTop],document:[document.documentElement.clientHeight,document.documentElement.scrollHeight,window.scrollY],list:[list.clientHeight,list.scrollHeight],letter:[letter.clientHeight,letter.scrollHeight],width:rect('columns').width};
        window.representativeMetrics=metrics;
        check(window.scrollY===0 && shell.scrollTop===0 && list.scrollTop===0 && letter.scrollTop===0,'initial offsets before focus or scrolling');
        check(document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1,'document still');
        check(shell.scrollHeight<=shell.clientHeight+1,'Shell still: '+JSON.stringify(metrics));
        const bar=document.querySelector('header').getBoundingClientRect();
        for(const {id,box} of bounds)check(box.top>=bar.bottom && box.bottom<=innerHeight && box.left>=0 && box.right<=innerWidth,id+' fully visible: '+JSON.stringify(metrics));
        check(Math.abs(rect('list-column').top-rect('letter-column').top)<1,'side-by-side columns');
        check(list.clientHeight>=list.querySelector('button').getBoundingClientRect().height && list.scrollHeight>list.clientHeight,'usable long list');
        check(letter.clientHeight>=parseFloat(getComputedStyle(letter.querySelector('p')).lineHeight) && letter.scrollHeight>letter.clientHeight,'usable long letter');
        window.fixedPositions=bounds.map(({id,box})=>[id,box.top,box.bottom]);
        return metrics;
      })()`,
      );
      await record(
        `representative ${locale} ${width} independent scrolling`,
        `(()=>{
        const list=element('list-body'),letter=element('letter-body');list.scrollTop=100;
        check(list.scrollTop===100 && letter.scrollTop===0,'list scroll independent');letter.scrollTop=100;
        check(list.scrollTop===100 && letter.scrollTop===100,'letter scroll independent');
        for(const [id,top,bottom] of fixedPositions){const box=(id.endsWith('-head')?element(id).parentElement:element(id)).getBoundingClientRect();check(box.top===top && box.bottom===bottom,'fixed heading/head/foot '+id);}
        check(shellBody().scrollTop===0 && window.scrollY===0,'outer owners still');
        return {list:list.scrollTop,letter:letter.scrollTop};
      })()`,
      );
    }
  }
  if (!process.env.SCREEN_REPRESENTATIVE_ONLY) {
    for (const [width, height] of [
      [1920, 1080],
      [1280, 720],
      [1279, 720],
      [1024, 720],
      [1023, 720],
      [800, 720],
    ]) {
      await load('layout-screen--correspondence', width, height);
      await record(
        `composition ${width}x${height}`,
        `(()=>{
   check(document.querySelectorAll('main').length===1,'one main');check(document.querySelectorAll('nav').length===1,'one nav');check(document.querySelectorAll('header').length===1,'one banner');
   check(document.documentElement.scrollWidth<=innerWidth,'document horizontal overflow');
   const row=Math.abs(rect('list-column').top-rect('letter-column').top)<1;
   check(row===(innerWidth>=1280),'exact viewport gate');
   const nav=document.querySelector('nav').getBoundingClientRect();
   check((nav.right<=rect('heading').left)===(innerWidth>=1024),'independent sidebar boundary');
   const metrics={width:innerWidth,available:rect('columns').width,row,shell:[shellBody().clientHeight,shellBody().scrollHeight],bodies:['list-body','letter-body'].map(id=>({id,client:element(id).clientHeight,scroll:element(id).scrollHeight}))};
   if(row){for(const id of ['heading','list-head','letter-head','letter-foot']){const box=rect(id);check(box.top>=0 && box.bottom<=innerHeight,id+' fully visible');}check(shellBody().scrollHeight<=shellBody().clientHeight+1,'shell still');}
   else {check(shellBody().scrollHeight>shellBody().clientHeight,'shell fallback');for(const id of ['list-body','letter-body'])check(element(id).scrollHeight<=element(id).clientHeight+1,'unbounded pane');}
   return metrics;
  })()`,
      );
      if (width >= 1280) {
        await record(
          `independent scrolling ${width}`,
          `(()=>{const foot=rect('letter-foot').top,head=rect('letter-head').top;const list=element('list-body'),letter=element('letter-body');list.scrollTop=100;check(list.scrollTop===100 && letter.scrollTop===0,'list independent');check(rect('letter-foot').top===foot && rect('letter-head').top===head,'letter fixed');letter.scrollTop=100;check(list.scrollTop===100 && letter.scrollTop===100,'letter independent');check(shellBody().scrollTop===0 && window.scrollY===0,'outer still');return {list:list.scrollTop,letter:letter.scrollTop};})()`,
        );
      }
    }
    await load('layout-screen--correspondence', 1280, 650);
    await record(
      'intermediate-height reachability',
      `(()=>{const body=element('list-body');check(body.clientHeight>0,'nonempty body cannot collapse inside nonoverflowing allocation');return {client:body.clientHeight,scroll:body.scrollHeight};})()`,
    );
    for (const story of [
      'correspondence',
      'delegated-table',
      'filling-tabs',
      'booking-stepper',
    ]) {
      await load(`layout-screen--${story}`);
      const bodyId =
        story === 'delegated-table'
          ? 'table'
          : story === 'correspondence'
            ? 'list-body'
            : 'panel-body';
      await evaluate(
        `window.saved=element('${bodyId}').querySelector('button');saved.focus();window.savedValue=saved.textContent;`,
      );
      await resize(1280, 250);
      await record(
        `short-height release ${story}`,
        `(()=>{const body=element('${bodyId}');check(body.clientHeight>0,'usable body');check(body.scrollHeight<=body.clientHeight+1,'natural body');check(saved.isConnected && saved.textContent===savedValue && document.activeElement===saved,'identity and focus retained');check(shellBody().scrollHeight>shellBody().clientHeight,'shell owns overflow');return {client:body.clientHeight,scroll:body.scrollHeight};})()`,
      );
      await evaluate(
        `element('${bodyId}').querySelectorAll('button').item(39)?.focus();`,
      );
      // Native focus reveal, followed by a real scroll key. No scrollIntoView is used.
      await key('PageDown', 'PageDown', 34);
      await record(
        `native reveal ${story}`,
        `(()=>{const focused=document.activeElement.getBoundingClientRect();check(focused.height>0,'focus visible');check(element('${bodyId}').clientHeight>0,'not a zero-height scroll clip');check(shellBody().scrollTop>0,'native outer scroll');return {focus:focused.toJSON(),shell:shellBody().scrollTop};})()`,
      );
      await resize(1280, 720);
      await record(
        `restored bound ${story}`,
        `(()=>{const body=element('${bodyId}');check(body.scrollHeight>body.clientHeight && body.clientHeight>0,'bounded again');check(shellBody().scrollHeight<=shellBody().clientHeight+1,'shell no residual overflow');check(saved.isConnected,'same mounted content');return {client:body.clientHeight,scroll:body.scrollHeight};})()`,
      );
    }
    for (const story of [
      'correspondence',
      'delegated-table',
      'filling-tabs',
      'booking-stepper',
    ]) {
      await load(`layout-screen--${story}`);
      const owner =
        story === 'delegated-table'
          ? 'table'
          : story === 'correspondence'
            ? 'list-body'
            : 'panel-body';
      for (const height of [
        250, 600, 630, 650, 675, 700, 720, 1080, 650, 720,
      ]) {
        await resize(1280, height);
        await evaluate(
          `element('${owner}').querySelector('button').focus();element('${owner}').querySelectorAll('button').item(39).focus()`,
        );
        await settle();
        await record(
          `height sweep ${story} ${height}`,
          `(()=>{const body=element('${owner}'),focus=document.activeElement.getBoundingClientRect(),box=body.getBoundingClientRect(),bar=document.querySelector('header').getBoundingClientRect();check(body.clientHeight>=focus.height,'usable normal control budget');check(focus.top>=Math.max(bar.bottom,box.top)-1 && focus.bottom<=Math.min(innerHeight,box.bottom)+1,'native focus fully visible');return {client:body.clientHeight,scroll:body.scrollHeight,focus:focus.toJSON(),shell:shellBody().scrollTop};})()`,
        );
      }
    }
    for (const story of ['correspondence', 'filling-tabs', 'booking-stepper']) {
      await load(`layout-screen--${story}`);
      const owner = story === 'correspondence' ? 'list-body' : 'panel-body';
      if (story !== 'correspondence') {
        await evaluate(`document.querySelectorAll('[role=tab]')[1].click()`);
        await settle();
      }
      await evaluate(
        `window.retained=element('${owner}').querySelector('button');retained.focus();`,
      );
      for (const width of [1279, 1024, 800, 1280]) {
        await resize(width, 720);
        await record(
          `width transition retains focus ${story} ${width}`,
          `(()=>{check(document.activeElement===retained && retained.isConnected,'same focused control');
        if('${story}'!=='correspondence')check(document.querySelectorAll('[role=tab]')[1].getAttribute('aria-selected')==='true','selected panel retained');
        const body=element('${owner}');check(body.clientHeight>0,'usable owner');
        return {scroll:body.scrollTop,client:body.clientHeight,extent:body.scrollHeight};})()`,
        );
      }
      await key('Tab', 'Tab', 9);
      await record(
        `native reveal after width transitions ${story}`,
        `(()=>{const box=document.activeElement.getBoundingClientRect(),owner=element('${owner}').getBoundingClientRect();check(box.top>=Math.max(owner.top,document.querySelector('header').getBoundingClientRect().bottom)-1 && box.bottom<=Math.min(owner.bottom,innerHeight)+1,'next control revealed');return box.toJSON();})()`,
      );
    }
    await load('layout-screen--correspondence', 1920, 1080);
    await evaluate(
      `window.scrolledControl=element('list-body').querySelectorAll('button')[3];scrolledControl.focus();element('list-body').scrollTop=100;`,
    );
    await resize(1600, 1080);
    await record(
      'bounded width preserves nonzero scroll',
      `({assertion:check(element('list-body').scrollTop===100 && document.activeElement===scrolledControl,'bounded offset and focus retained')})`,
    );
    await resize(1920, 1080);
    for (let translation = 0; translation < 2; translation++) {
      await evaluate(
        `Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Translate').click()`,
      );
      await settle();
      await record(
        `bounded locale preserves nonzero scroll ${translation}`,
        `({assertion:check(element('list-body').scrollTop===100 && document.activeElement===scrolledControl && shellBody().scrollHeight<=shellBody().clientHeight+1,'bounded locale offset and focus retained')})`,
      );
    }
    await resize(1279, 1080);
    await record(
      'natural height clamps former pane offset',
      `({assertion:check(element('list-body').scrollTop===0 && element('list-body').clientHeight===element('list-body').scrollHeight && document.activeElement===scrolledControl,'natural owner clamps scroll without replacing focus')})`,
    );
    await load('layout-screen--independent-allocations');
    await record(
      'sibling allocation isolation',
      `(()=>{const first=element('short-holder').querySelector('[data-testid=panel-body]'),second=element('tall-holder').querySelector('[data-testid=panel-body]');check(first.scrollHeight<=first.clientHeight+1,'short releases');check(second.scrollHeight>second.clientHeight,'tall remains bounded');return true;})()`,
    );
    for (const story of ['filling-tabs', 'booking-stepper']) {
      await load(`layout-screen--${story}`);
      await evaluate(
        `window.previous=document.querySelector('[role=tabpanel]:not([hidden])');document.querySelectorAll('[role=tab]')[1].click()`,
      );
      await settle();
      await record(
        `participant replacement ${story}`,
        `(()=>{const panel=document.querySelector('[role=tabpanel]:not([hidden])'),body=panel.querySelector('[data-testid=panel-body]');check(panel!==previous,'new active panel');check(body.scrollHeight>body.clientHeight && body.clientHeight>0,'inactive/unmounted participant does not reject');return true;})()`,
      );
      await resize(1280, 250);
      await resize(1280, 720);
      await record(
        `selection retained ${story}`,
        `({assertion:check(document.querySelectorAll('[role=tab]')[1].getAttribute('aria-selected')==='true','selection after resize')})`,
      );
    }
    await load('layout-screen--correspondence');
    await evaluate(
      `window.originalHead=element('list-head').textContent;element('list-head').textContent=originalHead.repeat(8)`,
    );
    await settle();
    await record(
      'fixed content growth rejects',
      `({assertion:check(element('list-body').clientHeight===element('list-body').scrollHeight,'fixed content release')})`,
    );
    await evaluate(`element('list-head').textContent=originalHead`);
    await settle();
    await record(
      'fixed content shrink restores',
      `({assertion:check(element('list-body').clientHeight<element('list-body').scrollHeight,'fixed content restoration')})`,
    );
    await evaluate(
      `window.changeCount=0;window.changes=new MutationObserver(records=>changeCount+=records.length);changes.observe(document.querySelector('main'),{attributes:true,subtree:true});`,
    );
    await settle();
    await settle();
    await record(
      'allocation converges at rest',
      `({assertion:check(changeCount===0,'no probe feedback loop'),changes:changeCount})`,
    );
    await evaluate('changes.disconnect()');
    await load('layout-screen--correspondence');
    await evaluate(
      `window.heading=element('heading');window.originalHeading=heading.textContent;heading.textContent=originalHeading.repeat(8);`,
    );
    await settle();
    await record(
      'dynamic heading release',
      `({released:element('list-body').clientHeight===element('list-body').scrollHeight,assertion:check(element('list-body').clientHeight===element('list-body').scrollHeight,'heading forces natural flow')})`,
    );
    await evaluate('heading.textContent=originalHeading');
    await settle();
    await record(
      'dynamic heading restores',
      `({assertion:check(element('list-body').scrollHeight>element('list-body').clientHeight,'heading shrink restores')})`,
    );
    for (let iteration = 0; iteration < 3; iteration++) {
      await evaluate(
        `Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Content').click()`,
      );
      await settle();
      await record(
        `short empty long ${iteration}`,
        `(()=>{const body=element('list-body');if(${iteration}<2)check(body.scrollHeight<=body.clientHeight+1 && !body.hasAttribute('tabindex'),'short has no scroll stop');else check(body.scrollHeight>body.clientHeight,'long bounded');return {client:body.clientHeight,scroll:body.scrollHeight};})()`,
      );
    }
    for (const story of ['correspondence', 'content-dialog'])
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
        [1279, 720],
        [1024, 720],
        [800, 720],
      ]) {
        await load(`layout-screen--${story}`, width, height);
        await evaluate(
          `window.opener=element('letter-foot').querySelector('button');opener.focus();opener.click()`,
        );
        await settle();
        await record(
          `native modal ${story} ${width}`,
          `(()=>{const dialog=document.querySelector('dialog'),box=dialog.getBoundingClientRect(),bar=document.querySelector('header').getBoundingClientRect();check(dialog.matches(':modal'),'native modal');check(box.top>=bar.bottom && box.bottom<=innerHeight,'reserved bar');check(document.activeElement.closest('dialog')===dialog,'focus inside');document.querySelector('nav button').focus();check(dialog.contains(document.activeElement),'background inert');check(Math.abs(rect('list-column').top-rect('letter-column').top)<1===(innerWidth>=1280),'underlying policy unchanged');return {dialog:box.toJSON(),bar:bar.toJSON()};})()`,
        );
        await key('Tab', 'Tab', 9);
        await key('Tab', 'Tab', 9, 8);
        await record(
          `native trap ${story} ${width}`,
          `({assertion:check(document.querySelector('dialog').contains(document.activeElement),'Tab trapped'),outline:check(Number.parseFloat(getComputedStyle(document.activeElement).outlineWidth)>0,'keyboard focus outline')})`,
        );
        await key('Escape', 'Escape', 27);
        await record(
          `restore opener ${story} ${width}`,
          `({assertion:check(!document.querySelector('dialog').open && document.activeElement===opener,'Escape restores focus')})`,
        );
      }
    await load('layout-screen--independent-policies', 1279, 720);
    await record(
      'adjacent nested default policies',
      `(()=>{const defaults=document.querySelectorAll('[data-testid=container]');for(const root of defaults)check(root.children[0].getBoundingClientRect().top===root.children[1].getBoundingClientRect().top,'default does not inherit viewport gate');const root=element('viewport');check(root.children[1].getBoundingClientRect().top>root.children[0].getBoundingClientRect().top,'viewport stacks');check(root.children[0].getBoundingClientRect().width===root.getBoundingClientRect().width,'stack releases cap');return defaults.length;})()`,
    );
    await resize(1920, 720);
    await record(
      'narrow holder on wide viewport',
      `(()=>{const roots=document.querySelectorAll('[data-testid=viewport]'),wide=roots[0],narrow=roots[1];check(wide.children[0].getBoundingClientRect().top===wide.children[1].getBoundingClientRect().top,'wide row');check(narrow.children[0].getBoundingClientRect().top<narrow.children[1].getBoundingClientRect().top,'narrow stack');check(wide.children[0].getBoundingClientRect().width<=192,'row cap');return true;})()`,
    );
    await load('layout-screen--correspondence');
    await evaluate(`document.documentElement.style.fontSize='24px'`);
    await settle();
    await record(
      'font enlargement preserves readable fallback',
      `({assertion:check(rect('list-column').top<rect('letter-column').top,'rem minimum fit fails independently')})`,
    );
    await load('layout-screen--correspondence', 1280, 650);
    await evaluate(`element('list-pane').style.display='none'`);
    await settle();
    await record(
      'hidden owner accepts',
      `({assertion:check(element('letter-body').scrollHeight>element('letter-body').clientHeight,'hidden list must not reject letter allocation')})`,
    );
    await evaluate(`element('list-pane').style.display=''`);
    await settle();
    await record(
      'visible owner participates again',
      `({assertion:check(element('list-body').clientHeight===element('list-body').scrollHeight,'shown list rejects unusable allocation')})`,
    );
    await load('layout-screen--correspondence');
    await evaluate(
      `element('list-body').querySelector('button').style.height='2000px'`,
    );
    await settle();
    await record(
      'oversized item does not demand full fit',
      `({assertion:check(element('list-body').scrollHeight>element('list-body').clientHeight && shellBody().scrollHeight<=shellBody().clientHeight+1,'normal scrolling viewport retained for oversized item')})`,
    );
    await load('layout-screen--delegated-table');
    await record(
      'delegated semantics and sole owner',
      `(()=>{check(!element('letter-body').hasAttribute('tabindex'),'delegator has no stop');check(element('table').getAttribute('tabindex')==='0','table owns scrolling');check(document.querySelector('caption').textContent==='Agreement rows','caption retained');return true;})()`,
    );
    await load('layout-screen--unsized');
    await record(
      'unsized screen is natural height',
      `({assertion:check(element('panel-body').scrollHeight<=element('panel-body').clientHeight+1,'unsized natural')})`,
    );
    await load('layout-screen--correspondence');
    await evaluate(
      `window.beforeLocale=element('list-body').querySelector('button');beforeLocale.focus();Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Translate').click()`,
    );
    await settle();
    await record(
      'oversized translated heading reachability (not reference fit)',
      `(()=>{check(beforeLocale.isConnected && document.activeElement===beforeLocale,'locale preserves child identity and focus');check(element('list-body').clientHeight>0 && element('letter-body').clientHeight>0,'translated content stays reachable');return {heading:rect('heading').toJSON(),bar:document.querySelector('header').getBoundingClientRect().toJSON(),shell:[shellBody().clientHeight,shellBody().scrollHeight]};})()`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Translate').click()`,
    );
    await settle();
    await record(
      'locale restoration',
      `({assertion:check(shellBody().scrollHeight<=shellBody().clientHeight+1 && document.activeElement===beforeLocale,'restored locale remains bounded with retained focus')})`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Foot').click()`,
    );
    await settle();
    await record(
      'conditional foot removed',
      `({assertion:check(!element('letter-foot') && element('letter-body').clientHeight>0,'no foot allocation retained')})`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('header button')).find(button=>button.textContent==='Foot').click()`,
    );
    await settle();
    await record(
      'conditional foot restored',
      `({assertion:check(rect('letter-foot').bottom<=innerHeight,'foot fits again')})`,
    );
    await load('layout-screen--mount-lifecycle', 1280, 250);
    await evaluate(
      `window.removedMain=document.querySelector('main');document.querySelector('header button').click()`,
    );
    await settle();
    await resize(1280, 720);
    await record(
      'Screen teardown',
      `({assertion:check(!removedMain.isConnected && !document.querySelector('main'),'Screen unmounted')})`,
    );
    await evaluate(`document.querySelector('header button').click()`);
    await settle();
    await record(
      'Screen remount',
      `({assertion:check(element('panel-body').scrollHeight>element('panel-body').clientHeight && shellBody().scrollHeight<=shellBody().clientHeight+1,'fresh bounded registration')})`,
    );
    await load('layout-shell--page');
    await record(
      'legacy page Shell',
      `(()=>{const body=document.querySelector('[role=group][aria-label=Workspace]');check(body && body.scrollHeight>body.clientHeight,'page body owns scrolling');const top=document.querySelector('header').getBoundingClientRect().top;body.scrollTop=100;check(body.scrollTop===100 && document.querySelector('header').getBoundingClientRect().top===top && window.scrollY===0,'page scrolling stays in Shell');return true;})()`,
    );
    await load('layout-dialog--ordinary-confirmation');
    await evaluate(
      `window.defaultOpener=Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='End employment…');defaultOpener.focus();defaultOpener.click()`,
    );
    await settle();
    await record(
      'legacy default viewport Dialog',
      `(()=>{const dialog=document.querySelector('dialog'),box=dialog.getBoundingClientRect();check(dialog.matches(':modal') && box.top>=0 && box.bottom<=innerHeight,'default native viewport modal');return box.toJSON();})()`,
    );
    await key('Escape', 'Escape', 27);
    await record(
      'legacy default Dialog focus',
      `({assertion:check(document.activeElement===defaultOpener,'default opener restored')})`,
    );
    // Replace Storybook preview CSS with each published entry; fixture theme declarations stay.
    for (const stylesheet of [
      'styles.css',
      'styles.light.css',
      'styles.dark.css',
    ]) {
      const css = await readFile(
        new URL(`../dist/${stylesheet}`, import.meta.url),
        'utf8',
      );
      await load('layout-screen--correspondence');
      await evaluate(
        `document.querySelectorAll('style[data-vite-dev-id],link[rel=stylesheet]').forEach(node=>node.remove());const sheet=document.createElement('style');sheet.textContent=${JSON.stringify(css)};document.head.append(sheet);`,
      );
      await settle();
      await record(
        `shipped ${stylesheet} bounded`,
        `({assertion:check(rect('letter-foot').bottom<=innerHeight && shellBody().scrollHeight<=shellBody().clientHeight+1,'published bounded layout')})`,
      );
      await resize(1279, 720);
      await record(
        `shipped ${stylesheet} viewport gate`,
        `({assertion:check(rect('list-column').top<rect('letter-column').top && element('list-body').scrollHeight<=element('list-body').clientHeight+1,'published stack and release')})`,
      );
    }
  }
  await writeFile(
    report,
    JSON.stringify(
      { browser: await send('Browser.getVersion'), results },
      null,
      2,
    ),
  );
} finally {
  socket?.close();
  if (chrome.pid && chrome.exitCode === null && chrome.signalCode === null) {
    await new Promise((resolve) => {
      const timeout = setTimeout(() => chrome.kill('SIGKILL'), 2000);
      chrome.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      chrome.kill();
    });
  }
  await rm(profile, { recursive: true, force: true });
}
