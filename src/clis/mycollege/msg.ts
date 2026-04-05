import os from 'node:os';
import path from 'node:path';
import fs from "node:fs";
import yaml from 'js-yaml';
import { cli, Strategy } from '../../registry-api.js';
import {IPage} from "../../types.js";


interface CollegeConfig {
  // 内部门户系统入口位置，可以通过定时打开刷新，确保 COOKIE 不过期
  HOME_URL: string;
  // 系统内部消息入口和获取API地址
  MESSAGE_URL: string;
  MESSAGE_API_URL: string;
}

function loadConfig(): CollegeConfig {
  const configPaths = [
    path.join(os.homedir(), '.college.yaml'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return yaml.load(content) as CollegeConfig;
    }
  }
  throw new Error("Can't open ~/.college.yaml!");
}
const config = loadConfig();

cli({
  site: 'mycollege',
  name: 'msg',
  description: '获取站内信',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'limit', type: 'int', default: 20, help: '返回站内信列表' },
  ],
  columns: ['主题', '发信人', '发信人部门', '发信时间'],
  func: async (page: IPage, args) => {
    const limit = Number(args.limit) || 20;
    return loadInsiteMessage(page, limit);
  },
});

async function loadInsiteMessage(page: IPage, limit: number): Promise<any[]> {
    const messageUrl = config.MESSAGE_URL;
    const messageApiUrl = config.MESSAGE_API_URL;

    await page.goto(messageUrl);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const cookie = await page.getCookies({url: messageUrl});
    const result = await fetch(messageApiUrl, {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,ja;q=0.7,de;q=0.6,fr;q=0.5,ru;q=0.4,en;q=0.3,nb;q=0.2,la;q=0.1",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referer": config.MESSAGE_URL,
            "cookie": cookie.map((c: any) => `${c.name}=${c.value}`).join('; ')  
        },
        "body": `pageSize=${limit}&pageNumber=1`,
        "method": "POST"
    });
    const data = await result.json();
    const rows = data["datas"]["cxsjx"]["rows"];

    const messages = [];
    for (const r of rows) {
        messages.push({
            '主题':        r["SUBJECT"],
            '发信人':      r["CREATER_NAME"],
            '发信人部门':   r["CREATER_DEPART_NAMES"],
            '发信时间':     r["CREATE_DATE"]
        });
    }
    return messages;
}

