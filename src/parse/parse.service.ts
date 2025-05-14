/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable } from '@nestjs/common';
import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'patchright';
// import { chromium } from 'playwright-extra';
import defaultExport from 'puppeteer-extra-plugin-stealth';
import { anonymizeProxy } from 'proxy-chain';

const stealth = defaultExport();
// chromium.use(stealth);

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
  browser: any = null;
  context: BrowserContext | null = null;
  startPage: Page | null = null;
  dnsPage: Page | null = null;

  getErrorData() {
    return { name: 'Не найдены данные', price: 'Попробуйте еще раз' };
  }

  async getBrowserContext(): Promise<BrowserContext> {
    if (!this.browser && !this.context) {
      console.log('Запускаем браузер...');
      const oldProxy = 'socks5://1RtAFm:5EBXCM@147.45.94.139:8000';
      const newProxy = await anonymizeProxy(oldProxy);
      console.log('newProxy', newProxy);

      this.browser = await chromium.launch({
        headless: false,
        channel: 'chrome',
        // proxy: { server: newProxy },
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--enable-features=NetworkService',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      console.log('00');

      const userDataDir = 'C:\\Users\\alexey\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 3';

      console.log('01');

      this.context = await this.browser.newContext();

      // this.context = await this.browser.newContext({
      //   viewport: { width: 1280, height: 720 },
      //   locale: 'ru-RU',
      //   timezoneId: 'Europe/Moscow',
      //   ignoreHTTPSErrors: true,
      //   extraHTTPHeaders: {
      //     accept:
      //       'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      //     'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      //     'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',

      //     'accept-encoding': 'gzip, deflate, br',
      //     'sec-ch-ua-mobile': '?0',
      //     // 'sec-ch-ua-platform': '"Windows"',
      //     // 'upgrade-insecure-requests': '1',
      //   },
      // });

      // await this.context.addInitScript(() => {
      //   Object.defineProperty(navigator, 'userAgent', {
      //     value:
      //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.114 Safari/537.36',
      //     configurable: true,
      //   });

      //   Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
      //   Object.defineProperty(navigator, 'appVersion', {
      //     get: () =>
      //       '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.114 Safari/537.36',
      //   });

      //   Object.defineProperty(navigator, 'language', { get: () => 'en-US' });
      //   Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

      //   Object.defineProperty(navigator, 'webdriver', { get: () => false });

      //   Object.defineProperty(navigator, 'plugins', {
      //     get: () => [1, 2, 3],
      //   });
      //   Object.defineProperty(navigator, 'mimeTypes', {
      //     get: () => [{ type: 'application/pdf' }],
      //   });
      //   Object.defineProperty(window, 'screen', {
      //     get: () => ({
      //       width: 1280,
      //       height: 720,
      //       availWidth: 1280,
      //       availHeight: 720,
      //       colorDepth: 24,
      //       pixelDepth: 24,
      //     }),
      //   });

      //   Object.defineProperty(navigator, 'connection', {
      //     get: () => ({
      //       downlink: 1.35,
      //       effectiveType: '4g',
      //       rtt: 100,
      //       saveData: false,
      //     }),
      //     configurable: true,
      //   });

      //   Object.defineProperty(window, '__pwInitScripts', {
      //     get: () => undefined,
      //   });
      // });

      console.log('0000000000');

      console.log('browser', this.browser);

      // const page = await this.browser.newPage();

      this.startPage = await this.context.newPage();
      await this.startPage.goto('about:blank');
    }

    return this.context;
  }

  async getLinkData(url: string) {
    const site: ISite | null = getSiteInfo(url);
    console.log('site', site);

    if (site) {
      console.log('000');
      const context: BrowserContext = await this.getBrowserContext();
      console.log('001');

      const page: Page = await context.newPage();
      console.log('002');

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

        console.log(111);

        await page.goto(url, {
          waitUntil: site.name === (SiteNames.DNS as string) ? 'networkidle' : 'domcontentloaded',
        });

        console.log(222);
        // await page.goto(url, { waitUntil: 'networkidle' });
        // await page.waitForSelector('body', { timeout: 30000 }).catch(() => console.log('Body not found'));

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

          console.log(333);

          const siteType = await Promise.all([
            Promise.race([
              page.waitForSelector('.product-card__title', { timeout: 60000 }).then(() => {
                console.log('.product-card__title');
                return 0;
              }),
              page.waitForSelector('.product-card-top__title', { timeout: 60000 }).then(() => {
                console.log('.product-card-top__title');
                return 1;
              }),
            ]),
            Promise.race([
              page.waitForSelector('.product-buy__price', { timeout: 60000 }).then(() => {
                console.log('.product-buy__price');
                return 0;
              }),
              page
                .waitForSelector('.product-card-purchase__current-price', {
                  timeout: 60000,
                })
                .then(() => {
                  console.log('.product-card-purchase__current-price');
                  return 1;
                }),
              page
                .waitForSelector('.product-card-purchase__off-market', {
                  timeout: 60000,
                })
                .then(() => {
                  console.log('.product-card-purchase__off-market');
                  return 1;
                }),
              page
                .waitForSelector('.product-buy__price-wrap_not-avail', {
                  timeout: 60000,
                })
                .then(() => {
                  console.log('.product-buy__price-wrap_not-avail');
                  return 0;
                }),
            ]),
          ]).catch(() => {
            console.log('TIMEOUT');
            timeoutError = true;
          });

          console.log(444);

          if (timeoutError) {
            timeoutError = false;
            return this.getErrorData();
          }

          console.log('siteType', siteType);

          if (siteType[0]) {
            name = (await page.locator('.product-card-top__title').first().textContent()).trim();
            const priceElement = await page.locator('.product-buy__price').count();

            console.log('priceElement', price, priceElement);

            if (priceElement) {
              price = priceElement
                ? (
                    await page
                      .locator('.product-buy__price')
                      .first()
                      .evaluate((node) => {
                        return Array.from(node.childNodes)
                          .filter((n) => n.nodeType === Node.TEXT_NODE)
                          .map((n) => n.textContent.trim())
                          .join('');
                      })
                  ).trim()
                : 'Не нашли блок с ценой';
              console.log('PRICE', price);
            } else {
              price = priceElement
                ? (await page.locator('.product-buy__price-wrap_not-avail').first().textContent()).trim()
                : //   await page.locator('.product-buy__price-wrap_not-avail').evaluate((node) => {
                  //     console.log('node', node);

                  //     return Array.from(node.childNodes)
                  //       .filter((n) => n.nodeType === Node.TEXT_NODE)
                  //       .map((n) => n.textContent.trim())
                  //       .join('');
                  //   })
                  // ).trim()
                  'Не нашли блок с ценой';
              console.log('PRICE 2', price);
            }
          } else {
            name = (await page.locator('.product-card__title').first().textContent()).trim();
            const priceElement = await page.locator('.product-card-purchase__current-price').count();

            console.log('priceElement 2', price, priceElement);

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

//
// this.context = await chromium.launchPersistentContext(userDataDir, {
// this.context = await chromium.launch({
// this.browser = await chromium.launch({
//   headless: false,
//   channel: 'chrome',
//   // viewport: null,
//   // proxy: { server: newProxy },
//   // ignoreHTTPSErrors: true,
//   // locale: 'ru-RU',
//   // timezoneId: 'Europe/Moscow',
//   // args: ['--profile-directory=PARSER_PROFILE'],
//   args: [
//     '--userDataDir=C:\\Users\\alexey\\AppData\\Local\\Google\\Chrome\\User Data',
//     '--profileDirectory=Profile 3',
//     '--disable-blink-features=AutomationControlled',
//     '--disable-dev-shm-usage',
//     '--no-sandbox',
//     // '--profile-directory=Profile 3',
//   ],
// });

// this.startPage = pages.length ? pages[0] : await this.context.newPage();
