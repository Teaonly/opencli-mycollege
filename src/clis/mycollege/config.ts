import os from 'node:os';
import path from 'node:path';
import fs from "node:fs";
import yaml from 'js-yaml';

export interface CollegeConfig {
  // 内部门户系统入口位置，可以通过定时打开刷新，确保 COOKIE 不过期
  HOME_URL: string;
  // 系统内部（站内信）消息入口和获取API地址
  MESSAGE_URL: string;
  MESSAGE_API_URL: string;
  // 查询课表
  COURSE_URL: string;
  COURSR_API_URL: string;
  // 学校通知
  NEWS_URL: string;
  NEWS_API_URL: string;
}

export function loadConfig(): CollegeConfig {
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