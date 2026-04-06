import { cli, Strategy } from '../../registry-api.js';
import {IPage} from "../../types.js";

import { CollegeConfig, loadConfig} from "./config.js";

const config:CollegeConfig  = loadConfig();

cli({
  site: 'mycollege',
  name: 'news',
  description: '获取学校通知',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'limit', type: 'int', default: 12, help: '返回学校最新通知数' },
  ],
  columns: ['主题', '通知部门',  '通知时间'],
  func: async (page: IPage, args) => {
    const limit = Number(args.limit) || 20;
    return loadNotify(page, limit);
  },
});

async function loadNotify(page: IPage, limit: number): Promise<any[]> {
    const webUrl = config.NEWS_URL;
    const apiUrl = config.NEWS_API_URL;

    await page.goto(webUrl);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const cookie = await page.getCookies({url: webUrl});
    try {
        const result = await fetch(apiUrl, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,ja;q=0.7,de;q=0.6,fr;q=0.5,ru;q=0.4,en;q=0.3,nb;q=0.2,la;q=0.1",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": webUrl,
                "cookie": cookie.map((c: any) => `${c.name}=${c.value}`).join('; ')  
            },
            "body": `LMDM=ALL_LMDM&pageSize=${limit}&pageNumber=1`,
            "method": "POST"
        });
        const data = await result.json();
        const rows = data["datas"]["cxlmxdggxx"]["rows"];

        const messages = [];
        for (const r of rows) {
            messages.push({
                '主题':         r["GGBT"],
                '通知部门':     r["FBBM"],
                '通知时间':     r["FBSJ"]
            });
        }
        return messages;
    } catch (e) {
        console.log(e);
        throw e;
    }
}
