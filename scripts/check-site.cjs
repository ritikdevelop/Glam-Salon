// Run: node --experimental-websocket scripts/check-site.cjs
// Uses locally installed Chrome; no npm packages required.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'about.html', 'services.html', 'pricing.html', 'contact.html'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];
const report = [];
const missing = [];
for (const page of pages) {
  const markup=fs.readFileSync(path.join(root,page),'utf8');
  for(const match of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref=match[1];
    if(/^(?:https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const [file,hash]=ref.split('#');
    const target=path.join(root,decodeURIComponent(file || page));
    assert.ok(fs.existsSync(target),'Missing reference: '+page+' -> '+ref);
    if(hash && target.endsWith('.html')) assert.ok(fs.readFileSync(target,'utf8').includes('id="'+hash+'"'),'Missing anchor: '+ref);
  }
}
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    missing.push(req.url); res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
let browser, socket;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'glam-browser-'));
  browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide:true, stdio:'ignore' });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i=0; i<100 && !fs.existsSync(portFile); i++) await sleep(100);
  assert.ok(fs.existsSync(portFile), 'Chrome did not start');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
  let nextId=0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const item=pending.get(message.id); if(item){ pending.delete(message.id); message.error ? item.reject(message.error) : item.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  const call = (method, params={}) => new Promise((resolve, reject) => { const id=++nextId; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate = async expression => (await call('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true})).result.value;
  await call('Page.enable'); await call('Runtime.enable');
  fs.mkdirSync(path.join(root,'.review'),{recursive:true});
  for (const page of pages) {
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:origin + '/' + page});
    for (let i=0;i<100;i++) { if(await evaluate('document.readyState === "complete" && !!document.querySelector("main")'))break; await sleep(100); }
    for (const width of [1440,768,390]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
      await sleep(150);
      await evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await sleep(250);
      const result=await evaluate(`(() => {
        const all=[...document.querySelectorAll('[id]')];
        const ids=all.map(e=>e.id);
        const broken=[...document.images].filter(e=>e.complete && !e.naturalWidth).map(e=>e.src);
        return {width:innerWidth, scrollWidth:document.documentElement.scrollWidth, duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i), broken, main:document.querySelectorAll('main').length, scripts:document.scripts.length, current:document.querySelectorAll('.main-menu [aria-current="page"]').length, header:getComputedStyle(document.querySelector('header')).position, unresolved:[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash.length>1 && !document.getElementById(a.hash.slice(1))).map(a=>a.hash)};
      })()`);
      report.push({page,width,...result});
      assert.ok(result.scrollWidth<=width+1, page+' overflows at '+width+': '+result.scrollWidth);
      assert.equal(result.main,1); assert.equal(result.current,1);
      assert.deepEqual(result.duplicateIds,[]); assert.deepEqual(result.broken,[]); assert.deepEqual(result.unresolved,[]);
      if(width<992){
        assert.equal(await evaluate('getComputedStyle(document.querySelector("#main-navigation")).display'), 'none');
        await evaluate('document.querySelector(".menu-toggle").click()');
        assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true');
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
        assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
      }
      if(width!==768){
        const shot=await call('Page.captureScreenshot',{format:'png'});
        fs.writeFileSync(path.join(root,'.review',page.replace('.html','')+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
      }
    }
  }
  assert.deepEqual(errors,[], 'Browser JavaScript exceptions');
  assert.deepEqual(missing,[], 'Missing local resources');
  assert.equal(await evaluate('[...document.querySelectorAll("#contactForm input, #contactForm textarea")].every(e=>e.labels.length && e.autocomplete)'),true);
  assert.equal(await evaluate('document.querySelector("#contactForm").checkValidity()'),false);
  // Verify the visible form and card sections after scrolling, plus no-JS navigation.
  await evaluate('document.querySelector("#contactForm").scrollIntoView()');
  await sleep(150);
  const formShot = await call('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(root,'.review','contact-form-390.png'),Buffer.from(formShot.data,'base64'));
  await evaluate('document.documentElement.classList.remove("nav-ready")');
  assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#main-navigation")).display'),'none');
  await evaluate('document.documentElement.classList.add("nav-ready")');
  await call('Page.navigate',{url:origin+'/pricing.html#henna-art'});
  await sleep(500);
  assert.equal(await evaluate('document.querySelectorAll("#waxing .pricing-list li").length'),24);
  assert.equal(await evaluate('document.querySelectorAll("#henna-art .pricing-list li").length'),2);
  const pricesShot=await call('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(root,'.review','pricing-detail-390.png'),Buffer.from(pricesShot.data,'base64'));
  fs.writeFileSync(path.join(root,'.review','results.json'),JSON.stringify(report,null,2));
  console.log('PASS: 5 pages at desktop, tablet and mobile widths; navigation, landmarks, image loading, anchors, form labels, required fields, and local resources.');
  console.log(JSON.stringify(report.map(({page,width,scrollWidth,scripts})=>({page,width,scrollWidth,scripts}))));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{if(socket)socket.close(); if(browser)browser.kill();server.close();});
