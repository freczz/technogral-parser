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
        // proxy: { server: 'socks5://8ekQf9:Y8V21F@195.158.225.129:8000' },
        proxy: { server: newProxy },
        // proxy: {
        // 	server: 'SOCKS5://195.158.225.129:8000',
        // 	username: '8ekQf9',
        // 	password: 'Y8V21F',
        // },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--enable-webgl',
          '--enable-accelerated-2d-canvas',
          // '--user-data-dir=/tmp/chrome-profile',
          '--disable-blink-features=AutomationControlled',
          '--disable-automation',
          '--auto-open-devtools-for-tabs',
          // '--disable-gpu',
          // --enable-accelerated-2d-canvas
          // // '--disable-webgl',
          // '--disable-dev-shm-usage',
          // '--disable-features=IsolateOrigins,site-per-process',
          // '--disable-web-security',
          // '--disable-site-isolation-trials',
          // '--no-first-run',
          // '--no-service-autorun',
          // '--password-store=basic',
          // '--enable-features=NetworkService,ServiceWorker,ServiceWorkerNavigationPreload',
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
        locale: 'ru-RU',
        timezoneId: 'Europe/Moscow',
        storageState: hasStorageState ? storageStatePath : undefined,
      });

      const loadedCookies = await this.context.cookies();
      // console.log('Loaded cookies:', loadedCookies);

      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.35 Safari/537.36',
          configurable: true,
        });

        Object.defineProperty(window, '__pwInitScripts', {
          get: () => undefined,
        });
      });

      this.startPage = await this.context.newPage();
      await this.startPage.goto('about:blank');

      if (true) {
        console.log('Первый заход для получения куки...');
        this.startPage.on('response', (response) => {
          console.log(`startPage URL: ${response.url()} | Status: ${response.status()}`);
        });
        await this.startPage.evaluate(() => window.scrollTo(0, 500));
        await this.startPage.goto('https://www.dns-shop.ru/', { waitUntil: 'networkidle' });
        await this.startPage.waitForTimeout(3000);
        await this.context.storageState({ path: storageStatePath }); // Сохраняем куки и состояние
        console.log('Куки сохранены в', storageStatePath);
      } else {
        console.log('Используем сохранённые куки из', storageStatePath);
        await this.startPage.goto('about:blank');
      }
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

    if (site) {
      const context: BrowserContext = await this.getBrowserContext();

      const page: Page = await context.newPage();

      await page.evaluate(() => {
        // Object.defineProperty(navigator, 'userAgent', {
        //   value:
        //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0  Safari/537.36',
        //   configurable: true,
        // });

        Object.defineProperty(navigator, 'webdriver', {
          value: false,
          configurable: true,
        });

        const originalNavigator: unknown = Object.create(navigator);
        Object.defineProperty(window, 'navigator', {
          value: originalNavigator,
          writable: false,
        });

        const mockServiceWorker = {
          ready: Promise.resolve({
            state: 'activated',
            scriptURL: 'https://www.dns-shop.ru/mock-sw.js',
            unregister: () => Promise.resolve(true),
            update: () => Promise.resolve(),
          }),
          register: (scriptURL, options) => ({
            scope: (options?.scope as unknown) || ('/' as unknown),
            uninstall: () => Promise.resolve(true),
            update: () => Promise.resolve(),
          }),
          getRegistration: async () => undefined,
          getRegistrations: async () => [],
          controller: null,
          addEventListener: () => {},
        };

        Object.defineProperty(navigator, 'serviceWorker', {
          get: () => {
            console.log('ServiceWorker accessed');
            return mockServiceWorker;
          },
        });

        // Перехватываем navigator.serviceWorker
        // Object.defineProperty(navigator, 'serviceWorker', {
        //   value: mockServiceWorker,
        //   writable: false,
        //   configurable: false,
        // });

        // const devtools: any = (window as any).chrome.devtools;
        // if (!devtools) {
        //   window.open('', '_blank', 'devtools');
        // }
        // devtools.panels.selectTab('network');

        // Перехватываем вызовы через call/apply
        const originalCall = Function.prototype.call;
        Function.prototype.call = function (...args) {
          if ((this as any) === mockServiceWorker.ready) {
            console.log('Intercepted call to ready');
            return mockServiceWorker.ready;
          }
          return originalCall.apply(this, args);
        };

        const originalApply = Function.prototype.apply;
        Function.prototype.apply = function (...args) {
          if ((this as any) === mockServiceWorker.ready) {
            console.log('Intercepted apply to ready');
            return mockServiceWorker.ready;
          }
          return originalApply.apply(this, args);
        };
      });

      let name: string = 'unknown';
      let price: string = 'unknown';
      let timeoutError: boolean = false;

      try {
        if (site.name !== (SiteNames.WB as string) && site.name !== (SiteNames.DNS as string)) {
          await page.route('**/*', (route) => {
            if (
              route.request().resourceType() === 'stylesheet' ||
              route.request().resourceType() === 'image' ||
              route.request().resourceType() === 'font'
              // route.request().resourceType() === 'script'
            ) {
              route.abort();
            } else {
              route.continue();
            }
          });
        }

        await page.setExtraHTTPHeaders({
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://www.dns-shop.ru/',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        });

        page.on('response', (response) => {
          console.log(`URL: ${response.url()} | Status: ${response.status()}`);
        });

        // Логируем ошибки страницы
        // page.on('pageerror', (error) => {
        //   console.log(`Page error: ${error}`);
        // });

        // if (site.name === (SiteNames.DNS as string)) {
        //   await this.getDNSCookies(this.context, page);
        // }

        await page.route('**/__qrator/validatefewfwfw**', async (route) => {
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
        await page.evaluate(() => {
          console.log('User-Agent:', navigator.userAgent);
          console.log('WebGL:', !!window.WebGLRenderingContext);
        });

        // const initialResponse = await page.goto(url, {
        //   waitUntil: 'domcontentloaded', // Упрощаем ожидание
        //   timeout: 15000, // 15 секунд
        // });

        // if (initialResponse.status() === 401) {
        //   console.log('Получен 401, ждём завершения валидации...');
        //   const validateResponse = await page.waitForResponse((res) => res.url().includes('/__qrator/validate'), {
        //     timeout: 10000,
        //   });
        //   console.log('Ответ валидации:', validateResponse.status());
        //   await page.goto(url, {
        //     waitUntil: 'domcontentloaded',
        //     timeout: 15000,
        //   });
        // }

        await page.goto(url, {
          waitUntil: site.name === (SiteNames.DNS as string) ? 'networkidle' : 'domcontentloaded',
        });

        // await page.goto(url, { waitUntil: 'networkidle' });

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
        await page.close();
      }
    }

    if (!site) {
      return { name: 'Неверный сайт', price: 'Попробуйте подходящий сайт' };
    }
  }
}
