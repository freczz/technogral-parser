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

  getErrorData() {
    return { name: 'Не найдены данные', price: 'Попробуйте еще раз' };
  }

  async getBrowserContext(): Promise<BrowserContext> {
    if (!this.browser) {
      console.log('Запускаем браузер...');
      const oldProxy = 'socks5://8ekQf9:Y8V21F@195.158.225.129:8000';
      console.log(111, anonymizeProxy);
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

      console.log('storageStatePath', storageStatePath);
      console.log('hasStorageState', hasStorageState);

      this.context = await this.browser.newContext({
        // userAgent:
        //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'ru-RU',
        timezoneId: 'Europe/Moscow',
        storageState: hasStorageState ? storageStatePath : undefined,
      });

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
      // await this.startPage.goto('about:blank');

      if (!hasStorageState) {
        console.log('Первый заход для получения куки...');
        await this.startPage.goto('https://www.dns-shop.ru/', { waitUntil: 'networkidle' });
        await this.startPage.evaluate(() => window.scrollTo(0, 500));
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
          // 'User-Agent':
          // 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          // Cookie:
          //   'current_path=9565a5103f36ecea17597b8bfe0de40efdc12ecd83502fc6a8abccb573ee963ba%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A116%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22default%22%7D%22%3B%7D; phonesIdentV2=caff1e66-1e03-42dd-89ed-7c27e84a0a32; rsu-configuration-id=47861e030ca6b624d70319d97dcedd1125333d436e55e102657fb7bcc660104fa%3A2%3A%7Bi%3A0%3Bs%3A20%3A%22rsu-configuration-id…6%3A%22b7524313-5214-4a6e-9f12-89339866bd78%22%3B%7D; _ab__analog=analog_2; lang=ru; city_path=moscow; _csrf=e48f13688e5a4f17b765b6de9ab46233321cd0b40e15ca2b7a4e4349b3308408a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22oavzFKp-rm9eHX5-O2Dc6T7hUrABI0m0%22%3B%7D; qrator_jsr=1741087127.948.ERxKHhlW8e6nn1CV-io7a547b14iadnp7q7h5uq2uuefssj9q-00; qrator_ssid=1741087131.113.4OIwIlnjxQwms7rW-j0vakispj7fr6liiqvhu3nl5jjn4vhaj; qrator_jsid=1741087127.948.ERxKHhlW8e6nn1CV-q69enr6l3egsuohgohsfi6qe1hduf72r',
        });

        page.on('response', (response) => {
          console.log(`URL: ${response.url()} | Status: ${response.status()}`);
        });

        // Логируем ошибки страницы
        page.on('pageerror', (error) => {
          console.log(`Page error: ${error}`);
        });

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
