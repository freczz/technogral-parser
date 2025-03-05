/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable } from '@nestjs/common';
import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import defaultExport from 'puppeteer-extra-plugin-stealth';
import { anonymizeProxy } from 'proxy-chain';
import * as fs from 'fs';
// import browserlessFactory from 'browserless';
// const browserless = browserlessFactory({ token: 'YOUR_API_TOKEN' });

const stealth = defaultExport();
chromium.use(stealth);

interface ISite {
  name: string;
  domain: string;
}

enum SiteNames {
  WB = 'WB',
  DNS = 'DNS',
  YANDEX = 'Yandex',
  OZON = 'OZON',
}

const SUPPORTED_SITES: ISite[] = [
  { name: 'WB', domain: 'wildberries.' },
  { name: 'DNS', domain: 'dns-shop.' },
  { name: 'Yandex', domain: 'market.yandex.' },
  { name: 'OZON', domain: 'ozon.' },
];

function getSiteInfo(url: string): ISite | null {
  return SUPPORTED_SITES.find((site) => url.includes(site.domain)) || null;
}

@Injectable()
export class ParseService {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  startPage: Page | null = null;
  dnsPage: Page | null = null;

  getErrorData() {
    return { name: 'Не найдены данные', price: 'Попробуйте еще раз' };
  }

  async getBrowserContext(): Promise<BrowserContext> {
    if (!this.browser) {
      console.log('Запускаем браузер...');
      const oldProxy = 'socks5://8ekQf9:Y8V21F@195.158.225.129:8000';
      console.log(111, anonymizeProxy);
      const profileDir = '/tmp/profile/';
      const hasprofileDir = fs.existsSync(profileDir);
      console.log('hasprofileDir', hasprofileDir);

      // console.log(222, await ProxyChain.anonymizeProxy());

      const newProxy = await anonymizeProxy(oldProxy);
      // this.browser = await chromium.connect({
      //   wsEndpoint: `wss://production-sfo.browserless.io/chromium/playwright?token=Rsdblg5Tf0pesN03c9464065e2ee89e19ec4005b12`,
      // });
      this.browser = await chromium.launch({
        headless: false,
        channel: 'chrome',

        logger: {
          isEnabled: () => true, // Включаем логирование всегда
          log: (name, severity, message) => {
            // console.log(`[${severity}] ${name}: ${message}`);
          },
        },
        // channel: 'chrome',
        proxy: { server: newProxy },
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--enable-unsafe-swiftshader',
          // '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
        ],
      });

      const storageStatePath = '/tmp/cookies.json';
      const hasStorageState = fs.existsSync(storageStatePath);
      console.log('hasStorageState', hasStorageState);
      // const hasStorageState = false;

      // console.log('storageStatePath', storageStatePath);
      // console.log('hasStorageState', hasStorageState);

      this.context = await this.browser.newContext({
        // userAgent:
        //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',s
        viewport: { width: 1280, height: 720 },
        // locale: 'ru-RU',
        timezoneId: 'Europe/Moscow',
        ignoreHTTPSErrors: true,
        // storageState: hasStorageState ? storageStatePath : undefined,
      });

      // const loadedCookies = await this.context.cookies();
      // console.log('Loaded cookies:', loadedCookies);

      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
          configurable: true,
        });

        // Object.defineProperty(navigator, 'getUserMedia', { value: () => {}, configurable: true });
        // Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        //   value: () => Promise.resolve(),
        //   configurable: true,
        // });

        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'appVersion', {
          get: () =>
            '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
        });

        Object.defineProperty(navigator, 'language', { get: () => 'en-US' });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            downlink: 1.35,
            effectiveType: '4g',
            rtt: 100,
            saveData: false,
          }),
          configurable: true,
        });

        // const getParameter = WebGLRenderingContext.prototype.getParameter;
        // WebGLRenderingContext.prototype.getParameter = function (parameter) {
        //   if (parameter === 37446) return 'ANGLE (Intel, Mesa Intel(R) UHD Graphics (ICL GT1), OpenGL 4.6)';
        //   if (parameter === 37445) return 'Google Inc. (Intel)';
        //   return getParameter.apply(this, arguments);
        // };
        // Object.defineProperty(window, 'callPhantom', { get: () => undefined });
        // Object.defineProperty(window, 'opera', { get: () => undefined });
        // delete (window as any).callPhantom;
        // delete (window as any).opera;

        // Object.defineProperty(window, 'callPhantom', {
        //   get: () => undefined,
        //   set: () => {},
        //   configurable: true,
        //   enumerable: false,
        // });
        // Object.defineProperty(window, 'opera', {
        //   get: () => undefined,
        //   set: () => {},
        //   configurable: true,
        //   enumerable: false,
        // });

        // // Эмуляция window.chrome для windowChrome: false
        // (window as any).chrome = {
        //   runtime: {},
        //   loadTimes: () => ({}),
        //   csi: () => ({}),
        //   app: {},
        //   webstore: {},
        //   getVariable: () => null,
        // };

        // const pluginArray = [
        //   { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        //   { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        //   { name: 'Chromium PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        //   {
        //     name: 'Microsoft Edge PDF Viewer',
        //     description: 'Portable Document Format',
        //     filename: 'internal-pdf-viewer',
        //   },
        //   { name: 'WebKit built-in PDF', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        // ].map((plugin) => {
        //   const p = Object.create(Plugin.prototype);
        //   Object.assign(p, plugin, { length: 0, item: () => null, namedItem: () => null });
        //   return p;
        // });

        // const plugins = Object.create(PluginArray.prototype);
        // pluginArray.forEach((p, i) => (plugins[i] = p));
        // Object.defineProperty(plugins, 'length', { get: () => pluginArray.length });
        // Object.defineProperty(plugins, 'item', { value: (index) => pluginArray[index] || null });
        // Object.defineProperty(plugins, 'namedItem', {
        //   value: (name) => pluginArray.find((p) => p.name === name) || null,
        // });

        // Object.defineProperty(navigator, 'plugins', { get: () => plugins });

        // Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });

        // console.log('IS ONE');

        // if (Object.prototype.hasOwnProperty.call(window, 'callPhantom')) {
        //   console.log('IS TWO');
        //   delete (window as any).callPhantom;
        // }
        // if (Object.prototype.hasOwnProperty.call(window, 'opera')) {
        //   console.log('IS THREE');
        //   delete (window as any).opera;
        // }

        // delete (window as any).callPhantom;
        // delete (window as any).opera;

        // Защита от переопределения
        // Object.defineProperty(window, 'callPhantom', {
        //   value: undefined,
        //   writable: false,
        //   configurable: false,
        // });
        // Object.defineProperty(window, 'opera', {
        //   value: undefined,
        //   writable: false,
        //   configurable: false,
        // });

        // Удаление из прототипа
        // const proto = Object.getPrototypeOf(window);
        // delete proto.callPhantom;
        // delete proto.opera;
        // Object.defineProperty(proto, 'callPhantom', {
        //   value: undefined,
        //   writable: false,
        //   configurable: false,
        // });
        // Object.defineProperty(proto, 'opera', {
        //   value: undefined,
        //   writable: false,
        //   configurable: false,
        // });

        Object.defineProperty(window, '__pwInitScripts', {
          get: () => undefined,
        });
      });

      this.startPage = await this.context.newPage();
      await this.startPage.goto('about:blank');

      // if (!hasStorageState) {
      //   console.log('Первый заход для получения куки...');
      //   this.startPage.on('response', (response) => {
      //     console.log(`startPage URL: ${response.url()} | Status: ${response.status()}`);
      //   });
      //   await this.startPage.evaluate(() => window.scrollTo(0, 500));
      //   await this.startPage.goto('https://www.dns-shop.ru/', { waitUntil: 'networkidle' });
      //   await this.startPage.waitForTimeout(3000);
      //   await this.context.storageState({ path: storageStatePath }); // Сохраняем куки и состояние
      //   console.log('Куки сохранены в', storageStatePath);
      // } else {
      //   console.log('Используем сохранённые куки из', storageStatePath);
      //   await this.startPage.goto('about:blank');
      // }
    }

    return this.context;
  }

  // async _getDNSCookies(page: Page) {
  //   try {
  //     console.log('Обновляем куки с главной страницы...');
  //     page.on('response', (res) => console.log(`Response: ${res.url()} - ${res.status()}`));
  //     await page.goto('https://www.dns-shop.ru/', { waitUntil: 'networkidle', timeout: 60000 });
  //     await page.evaluate(() => {
  //       window.scrollTo(0, Math.random() * 1000);
  //       setTimeout(() => window.scrollTo(0, Math.random() * 1000), 1000);
  //     });
  //     await page.waitForTimeout(3000 + Math.random() * 2000);
  //     await this.context.storageState({ path: '/tmp/cookies.json' });
  //     console.log('Куки успешно обновлены');
  //   } catch (error) {
  //     console.error('Ошибка обновления куки:', error);
  //   }
  // }

  // async __getDNSCookies(context: BrowserContext, page: Page) {
  //   try {
  //     console.log('Обновляем куки с главной страницы...');
  //     page.on('response', (res) => console.log(`Response: ${res.url()} - ${res.status()}`));

  //     await page.goto('https://www.dns-shop.ru/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  //     // Ждём загрузки скрипта Qrator
  //     await page.waitForResponse((response) => response.url().includes('/__qrator/qauth_utm_v2'), { timeout: 30000 });

  //     // Выполняем JavaScript-челлендж и проверяем результат
  //     const challengeSuccess = await page.evaluate(async () => {
  //       if (typeof (window as any).__qrator !== 'undefined') {
  //         const urlParams = new URLSearchParams(window.location.search);
  //         const nonce = urlParams.get('nonce') || '';
  //         const pow = urlParams.get('pow') || '';
  //         const qsessid = urlParams.get('qsessid') || '';

  //         if (nonce && pow && qsessid) {
  //           // Упрощённая имитация PoW (нужен точный алгоритм от Qrator)
  //           const result = `${nonce}.${Math.random().toString(36).substring(2)}`;
  //           const response = await fetch(
  //             `/__qrator/validate?pow=${pow}&nonce=${nonce}&qsessid=${qsessid}&result=${result}`
  //           );
  //           return response.ok; // true, если статус 200-299
  //         }
  //       }
  //       return false; // Челлендж не выполнен
  //     });

  //     if (challengeSuccess) {
  //       await page.waitForTimeout(3000 + Math.random() * 2000);
  //       await context.storageState({ path: '/tmp/cookies.json' });
  //       console.log('Куки успешно обновлены после челленджа');
  //     } else {
  //       console.error('Челлендж Qrator не пройден');
  //     }
  //   } catch (error) {
  //     console.error('Ошибка обновления куки:', error);
  //   }
  // }

  async getLinkData(url: string) {
    const site: ISite | null = getSiteInfo(url);
    console.log('site', site);

    if (true) {
      const context: BrowserContext = await this.getBrowserContext();

      const page: Page = await context.newPage();

      // await page.evaluate(() => {
      //   console.log('Initial navigator.userAgent:', navigator.userAgent);
      //   console.log('Initial navigator.platform:', navigator.platform);
      // });

      // await page.evaluate(() => {
      //   console.log('Applying emulation...');
      //   Object.defineProperty(navigator, 'userAgent', {
      //     value:
      //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
      //     configurable: true,
      //   });
      //   Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
      //   Object.defineProperty(navigator, 'appVersion', {
      //     get: () =>
      //       '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
      //   });
      //   Object.defineProperty(window, 'callPhantom', { get: () => undefined });
      //   Object.defineProperty(window, 'opera', { get: () => undefined });
      //   Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });

      //   // Эмуляция plugins
      //   const pluginArray = {
      //     length: 1,
      //     item: (index: number) =>
      //       index === 0 ? { name: 'Widevine Content Decryption Module', filename: 'widevinecdm' } : null,
      //     namedItem: (name: string) =>
      //       name === 'Widevine Content Decryption Module' ? { name, filename: 'widevinecdm' } : null,
      //     [0]: { name: 'Widevine Content Decryption Module', filename: 'widevinecdm' },
      //   };
      //   Object.defineProperty(navigator, 'plugins', { get: () => pluginArray });

      //   // Лог после эмуляции
      //   console.log('Emulated navigator.userAgent:', navigator.userAgent);
      //   console.log('Emulated navigator.platform:', navigator.platform);
      // });

      let name: string = 'unknown';
      let price: string = 'unknown';
      let timeoutError: boolean = false;

      try {
        // if (site.name !== (SiteNames.WB as string) && site.name !== (SiteNames.DNS as string)) {
        //   await page.route('**/*', (route) => {
        //     if (
        //       route.request().resourceType() === 'stylesheet' ||
        //       route.request().resourceType() === 'image' ||
        //       route.request().resourceType() === 'font'
        //       // route.request().resourceType() === 'script'
        //     ) {
        //       route.abort();
        //     } else {
        //       route.continue();
        //     }
        //   });
        // }

        // await page.setExtraHTTPHeaders({
        //   Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        //   'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        //   'Accept-Encoding': 'gzip, deflate, br',
        //   Referer: 'https://www.dns-shop.ru/',
        //   Connection: 'keep-alive',
        //   'Upgrade-Insecure-Requests': '1',
        //   'Sec-Fetch-Dest': 'document',
        //   'Sec-Fetch-Mode': 'navigate',
        //   'Sec-Fetch-Site': 'none',
        //   'Sec-Fetch-User': '?1',
        // });

        page.on('response', (response) => {
          console.log(`URL: ${response.url()} | Status: ${response.status()}`);
        });

        page.on('request', (request) => {
          if (request.url().includes('dns-shop.ru/product')) {
            console.log('Playwright Headers:', request.headers());
          }
        });

        // if (site.name === (SiteNames.DNS as string)) {
        //   await this.getDNSCookies(this.context, page);
        // }

        await page.setExtraHTTPHeaders({
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          priority: 'u=0, i',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
          'upgrade-insecure-requests': '1',
        });

        await page.route('**/__qrator/validatedwadad**', async (route) => {
          console.log('VALIDATE');
          const requestUrl = route.request().url();
          console.log(111);
          const urlParams = new URLSearchParams(requestUrl.split('?')[1]);
          console.log(222);
          const pow = parseInt(urlParams.get('pow') || '13');
          console.log(333);
          const nonce = urlParams.get('nonce') || '1741384136.483.YVMGNP8ZdWmyIrsT';
          console.log(444);
          const qsessid = urlParams.get('qsessid') || '1r7trsb416o4nn1t4m274v246rkg8b50';

          function computePoW(pow: number, nonce: string): string {
            // Изменим возврат на строку
            console.log(555);
            let seed = parseInt(nonce.split('.')[0]) || 0;
            let b = BigInt(Math.imul(seed, 69069) + 1);
            let iteration = 0;
            const maxIterations = 1000000000;
            console.log(666);

            function countOnes(n: bigint): number {
              console.log(777);
              let count = 0;
              let num = n;
              while (num > 0n) {
                count += Number(num & 1n);
                num >>= 1n;
              }
              return count;
            }

            console.log(888);
            function generateNumberWithOnes(targetOnes: number, minBits: number): bigint {
              console.log('generateNumberWithOnes: targetOnes=', targetOnes, 'minBits=', minBits);
              let result = 0n;
              const availablePositions: number[] = Array.from({ length: minBits }, (_, i) => i);
              let positionsLeft = availablePositions.length;

              for (let i = 0; i < targetOnes; i++) {
                if (positionsLeft === 0) {
                  console.error('Недостаточно свободных позиций для targetOnes:', targetOnes);
                  break;
                }
                const posIndex = Math.floor(Math.random() * positionsLeft);
                const bitPos = availablePositions[posIndex];
                result |= 1n << BigInt(bitPos);
                availablePositions[posIndex] = availablePositions[positionsLeft - 1];
                positionsLeft--;
              }

              console.log('generateNumberWithOnes result:', result.toString());
              return result;
            }

            console.log(10000000);
            const minBits = Math.max(Math.ceil(Math.log2(pow * 2)) + pow * 2, 2048);
            let result = generateNumberWithOnes(pow, minBits);

            // Добавляем b, но корректируем, если количество единиц превышает pow
            let originalResult = result;
            result += b;
            if (countOnes(result) > pow) {
              console.log('Коррекция: количество единиц превышает pow, откатываем изменения');
              result = originalResult; // Откатываем, если добавление b увеличило ones
            }

            console.log(2222222222);
            let occupiedPositions: Set<number> = new Set();
            const initialBits = result.toString(2).split('').reverse();
            for (let i = 0; i < initialBits.length; i++) {
              if (initialBits[i] === '1') {
                occupiedPositions.add(i);
              }
            }

            while (countOnes(result) < pow && iteration < maxIterations) {
              const newOnesNeeded = pow - countOnes(result);
              if (newOnesNeeded > 0) {
                let newBitPos: number;
                do {
                  newBitPos = Math.floor(Math.random() * minBits);
                } while (occupiedPositions.has(newBitPos));

                const increment = 1n << BigInt(newBitPos);
                const newResult = result + increment;
                if (countOnes(newResult) <= pow) {
                  // Проверяем, не превышает ли новое значение pow
                  result = newResult;
                  occupiedPositions.add(newBitPos);
                }
              }
              iteration++;
              if (iteration % 1000000 === 0) {
                console.log('Current result in binary:', result.toString(2));
                console.log(`Итерация: ${iteration}, result: ${result.toString()}, ones: ${countOnes(result)}`);
              }
            }
            console.log(3333333333333);

            if (iteration >= maxIterations) {
              console.error('Превышен лимит итераций для pow:', pow);
              throw new Error('PoW computation timed out');
            }

            console.log(`Найден результат для pow ${pow}: ${result.toString()}, ones: ${countOnes(result)}`);
            return result.toString(); // Возвращаем как строку, чтобы избежать Infinity
          }

          try {
            // console.log(999);
            console.log(4444444444);
            const result = computePoW(pow, nonce);
            console.log(55555555555);
            // console.log(111111111111);
            const baseUrl = 'https://www.dns-shop.ru';
            const newUrl = `${baseUrl}/__qrator/validate?pow=${pow}&nonce=${nonce}&qsessid=${qsessid}&result=${result}`;
            console.log('newUrl:', newUrl, 'result:', result);

            await route.continue({ url: newUrl });
          } catch (error) {
            console.error('Ошибка вычисления PoW:', error);
            await route.continue(); // Продолжаем без изменения, если ошибка
          }
        });

        // Логируем отпечаток для отладки
        // await page.evaluate(() => {
        //   console.log('User-Agent:', navigator.userAgent);
        //   console.log('WebGL:', !!window.WebGLRenderingContext);
        // });

        // await page.goto(url, {
        //   waitUntil: site.name === (SiteNames.DNS as string) ? 'networkidle' : 'domcontentloaded',
        // });

        page.on('console', (msg) => console.log('CONSOLE ON CONSOLE:', msg.text()));
        await page.route('**/*', (route) => route.continue());

        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector('body', { timeout: 30000 }).catch(() => console.log('Body not found'));

        let environmentData;
        try {
          environmentData = await page.evaluate(() => {
            return {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              appVersion: navigator.appVersion,
              language: navigator.language,
              languages: navigator.languages,
              webdriver: !!navigator.webdriver, // Проверка на WebDriver
              vendor: navigator.vendor,
              getUserMedia: typeof (navigator as any).getUserMedia === 'function',
              getUserMedia2: typeof navigator.mediaDevices?.getUserMedia === 'function',
              maxTouchPoints: navigator.maxTouchPoints,
              hardwareConcurrency: navigator.hardwareConcurrency,
              deviceMemory: (navigator as any).deviceMemory,
              doNotTrack: navigator.doNotTrack,
              cookieEnabled: navigator.cookieEnabled,
              connection: {
                downlink: (navigator as any).connection?.downlink,
                effectiveType: (navigator as any).connection?.effectiveType,
                rtt: (navigator as any).connection?.rtt,
                saveData: (navigator as any).connection?.saveData,
              },
              screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
              },
              plugins: Array.from(navigator.plugins).map((plugin) => ({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
              })),
              mimeTypes: Array.from(navigator.mimeTypes).map((mime) => ({
                type: mime.type,
                description: mime.description,
                suffixes: mime.suffixes,
              })),
              // Проверка на наличие автоматизации
              // isAutomation: {
              //   windowChrome: typeof (window as any).chrome === 'undefined' || !(window as any).chrome,
              //   external: typeof window.external === 'undefined' || !window.external,
              //   callPhantom: typeof (window as any).callPhantom === 'undefined' || !(window as any).callPhantom,
              //   opera: typeof (window as any).opera === 'undefined' || !(window as any).opera,
              // },
              isAutomation: {
                windowChrome: !(window as any).chrome,
                external: !window.external,
                callPhantom: 'callPhantom' in window,
                opera: 'opera' in window,
              },
              // Проверка заголовков
              headers: {
                requestedUserAgent: window.navigator.userAgent, // Фактический User-Agent
              },
            };
          });
        } catch (evalError) {
          console.error('Error in page.evaluate:', evalError);
        }
        // Дополнительные данные от Playwright
        const browserVersion = this.browser.version();
        // const contextUserAgent = await (this.context as any).evaluate(() => navigator.userAgent); // Фактический User-Agent в контексте

        // Сравнение с указанным User-Agent
        // const specifiedUserAgent =
        //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36';
        // const userAgentMatch = environmentData.userAgent === specifiedUserAgent;

        // Вывод данных
        console.log('FULL ENVIRONMENT DATA:', environmentData);
        console.log('Browser Version (Playwright):', browserVersion);
        // console.log('Specified User-Agent:', specifiedUserAgent);
        // console.log('Actual User-Agent (from context):', contextUserAgent);
        console.log('Actual User-Agent (from page.evaluate):', environmentData.userAgent);
        // console.log('User-Agent Match:', userAgentMatch);
        // console.log('Environment Data:', JSON.stringify(environmentData, null, 2));

        // console.log('Collecting environment data...');
        // let environmentData;
        // try {
        //   environmentData = await page.evaluate(() => {
        //     return {
        //       userAgent: navigator.userAgent,
        //       platform: navigator.platform,
        //       appVersion: navigator.appVersion,
        //       language: navigator.language,
        //       languages: navigator.languages,
        //       webdriver: !!navigator.webdriver,
        //       vendor: navigator.vendor,
        //       maxTouchPoints: navigator.maxTouchPoints,
        //       hardwareConcurrency: navigator.hardwareConcurrency,
        //       deviceMemory: (navigator as any).deviceMemory,
        //       doNotTrack: navigator.doNotTrack,
        //       cookieEnabled: navigator.cookieEnabled,
        //       connection: {
        //         downlink: (navigator as any).connection?.downlink,
        //         effectiveType: (navigator as any).connection?.effectiveType,
        //         rtt: (navigator as any).connection?.rtt,
        //         saveData: (navigator as any).connection?.saveData,
        //       },
        //       screen: {
        //         width: screen.width,
        //         height: screen.height,
        //         availWidth: screen.availWidth,
        //         availHeight: screen.availHeight,
        //         colorDepth: screen.colorDepth,
        //       },
        //     };
        //   });
        //   console.log('Environment Data:', JSON.stringify(environmentData, null, 2));
        // } catch (evalError) {
        //   console.error('Error in page.evaluate:', evalError);
        // }

        // const content = await page.content();
        // console.log('content', content);

        if (site.name === (SiteNames.WB as string)) {
          const siteType = await Promise.race([
            page.waitForSelector('.product-page__title', { timeout: 20000 }).then(() => 0),
            page.waitForSelector("[data-tag='productName']", { timeout: 20000 }).then(() => 1),
          ]).catch(() => {
            console.log('TIMEOUT');
            timeoutError = true;
          });

          if (timeoutError) {
            timeoutError = false;
            return this.getErrorData();
          }

          if (siteType) {
            name = (await page.locator("[data-tag='productName']").first().textContent()).trim();
            const priceElement = await page.locator("[data-tag='productCurrentPrice']").count();

            price = priceElement
              ? (await page.locator("[data-tag='productCurrentPrice']").first().textContent()).trim()
              : 'Нет в наличии';
          } else {
            name = (await page.locator('.product-page__title').first().textContent()).trim();
            const redPriceElement = await page.locator('.red-price').count();

            if (redPriceElement) {
              price = (await page.locator('.red-price').first().textContent()).trim();
            } else {
              const priceElement = await page.locator('.price-block__final-price').count();

              price = priceElement
                ? (await page.locator('.price-block__final-price').first().textContent()).trim()
                : (await page.locator('.sold-out-product__text').first().textContent()).trim();
            }
          }
        }

        if (site.name === (SiteNames.DNS as string)) {
          // const title = await page.title();
          // console.log('title', title);

          // const content = await page.content();
          // console.log('content', content);

          // setTimeout(async () => {
          //   const title = await page.title();
          //   console.log('title 2', title);

          //   const content = await page.content();
          //   console.log('content 2', content);
          // }, 5000);

          const siteType = await Promise.all([
            Promise.race([
              page.waitForSelector('.product-card__title', { timeout: 60000 }).then(() => 0),
              page.waitForSelector('.product-card-top__title', { timeout: 60000 }).then(() => 1),
            ]),
            Promise.race([
              page.waitForSelector('.product-buy__price', { timeout: 60000 }).then(() => 0),
              page
                .waitForSelector('.product-card-purchase__current-price', {
                  timeout: 60000,
                })
                .then(() => 1),
              page
                .waitForSelector('.product-card-purchase__off-market', {
                  timeout: 60000,
                })
                .then(() => 1),
            ]),
          ]).catch(() => {
            console.log('TIMEOUT');
            timeoutError = true;
          });

          if (timeoutError) {
            timeoutError = false;
            return this.getErrorData();
          }

          console.log('siteType', siteType);

          if (siteType[0]) {
            name = (await page.locator('.product-card-top__title').first().textContent()).trim();
            const priceElement = await page.locator('.product-buy__price').count();

            console.log('priceElement', priceElement);

            price = priceElement
              ? (
                  await page.locator('.product-buy__price').evaluate((node) => {
                    return Array.from(node.childNodes)
                      .filter((n) => n.nodeType === Node.TEXT_NODE)
                      .map((n) => n.textContent.trim())
                      .join('');
                  })
                ).trim()
              : 'Не нашли блок с ценой';
          } else {
            name = (await page.locator('.product-card__title').first().textContent()).trim();
            const priceElement = await page.locator('.product-card-purchase__current-price').count();

            price = priceElement
              ? (await page.locator('.product-card-purchase__current-price').first().textContent()).trim()
              : (await page.locator('.product-card-purchase__off-market').first().textContent()).trim();
          }
        }

        if (site.name === (SiteNames.YANDEX as string)) {
          const pageTitle = await page.title();
          console.log('pageTitle', pageTitle);

          if (pageTitle === 'Вы не робот?' || pageTitle.includes('Please confirm')) {
            return this.getErrorData();
          }

          await Promise.all([page.waitForSelector('h1', { timeout: 20000 })]).catch(() => {
            console.log('TIMEOUT');
            timeoutError = true;
          });

          if (timeoutError) {
            timeoutError = false;
            return this.getErrorData();
          }

          name = (await page.locator('h1').first().textContent()).trim();
          const priceElement1 = await page
            .locator("[data-auto='snippet-price-current']")
            // TODO: ЗДЕСЬ БЫЛ AWAIT НО TS ЖАЛУЕТСЯ
            .and(page.locator('h3'))
            .count();

          if (priceElement1) {
            price = (await page.locator("[data-auto='snippet-price-current']").first().textContent()).trim();
          } else {
            const priceElement2 = await page.locator("[data-auto='price-block']").count();
            if (priceElement2) {
              price = (await page.locator("[data-auto='price-block']").first().textContent()).trim();
            } else {
              const priceElement3 = await page.locator("[data-auto='price-value']").count();
              if (priceElement3) {
                price = (await page.locator("[data-auto='price-value']").first().textContent()).trim();
              } else {
                price = 'Нет в наличии.';
              }
            }
          }

          if (price.includes(':')) {
            price = price.split(':')[1].trim();
          }
        }

        if (site.name === (SiteNames.OZON as string)) {
          await Promise.all([page.waitForSelector('h1', { timeout: 20000 })]).catch(() => {
            console.log('TIMEOUT');
            timeoutError = true;
          });

          if (timeoutError) {
            timeoutError = false;
            return this.getErrorData();
          }

          name = (await page.locator('h1').first().textContent()).trim();

          if (name === 'Доступ ограничен') {
            return this.getErrorData();
          }

          const priceElement = await page.locator("[data-widget='webPrice']").count();

          if (priceElement) {
            price = (await page.locator("[data-widget='webPrice']").locator('span').first().textContent()).trim();
          } else {
            price = 'Нет в наличии.';
          }

          if (price.includes('c Ozon')) {
            price = price.split('c Ozon')[0].trim();
          }
        }

        console.log('Магазин:', site.name, '| Название:', name, '| Цена:', price);
        return { name, price };
      } catch (error) {
        return error;
      } finally {
        // await page.close();
      }
    }

    if (!site) {
      return { name: 'Неверный сайт', price: 'Попробуйте подходящий сайт' };
    }
  }
}
