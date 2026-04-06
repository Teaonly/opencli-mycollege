import { cli, Strategy } from '../../registry-api.js';
import {IPage} from "../../types.js";

import { CollegeConfig, loadConfig} from "./config.js";

const config:CollegeConfig  = loadConfig();

cli({
  site: 'mycollege',
  name: 'course',
  description: '查询我的课表',
  strategy: Strategy.COOKIE,
  args: [],
  columns: ['课程名', '上课周', '上课时间', '上课地点'],
  func: async (page: IPage, args) => {
    const limit = Number(args.limit) || 20;
    return loadCourse(page, limit);
  },
});

async function loadCourse(page: IPage, limit: number): Promise<any[]> {
    await page.goto(config.JIAOWU_URL);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await page.goto(config.COURSE_URL);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const cookie = await page.getCookies({url: config.COURSE_URL});
    console.log(cookie);
    try {
        const result = await fetch(config.COURSE_API_URL, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,ja;q=0.7,de;q=0.6,fr;q=0.5,ru;q=0.4,en;q=0.3,nb;q=0.2,la;q=0.1",
                "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "cookie": cookie.map((c: any) => `${c.name}=${c.value}`).join('; ') ,
                "Referer": `${config.COURSE_URL}`
            },
            "body": null,
            "method": "GET"
            });
        const data = await result.json();
        const rows = data["teacherTableVm"]["activities"];

        const messages = [];
        for (const r of rows) {
            messages.push({
                '课程名':         r["courseName"],
                '上课周':         r["weeksStr"],
                '上课时间':       `${r['startTime']}-${r['endTime']}`,
                '上课地点':       r["room"]
            });
        }
        return messages;
    } catch (e) {
        console.log(e);
        throw e;
    }
}


