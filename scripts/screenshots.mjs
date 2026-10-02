import { chromium } from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const base=process.env.PUBLIC_DEMO_URL||'http://127.0.0.1:5174';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(base+'/login');await page.getByRole('button',{name:'Explore the demo workspace'}).waitFor();
await page.screenshot({path:'docs/screenshots/01-sign-in.png',fullPage:true});
await page.getByRole('button',{name:'Explore the demo workspace'}).click();await page.locator('main h1').waitFor();
await page.screenshot({path:'docs/screenshots/02-dashboard.png',fullPage:true});
for(const [route,name] of [['cvs','03-cv-library'],['jobs','04-application-tracker'],['analyses','05-analysis-studio']]){await page.goto(base+'/'+route);await page.locator('main h1').waitFor();await page.screenshot({path:'docs/screenshots/'+name+'.png',fullPage:true});}
await page.locator('.analysis-list a').first().click();await page.locator('.report').waitFor();await page.screenshot({path:'docs/screenshots/06-analysis-report.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.locator('main h1').waitFor();await page.screenshot({path:'docs/screenshots/07-mobile-dashboard.png',fullPage:true});
await page.setViewportSize({width:820,height:1180});await page.reload();await page.locator('main h1').waitFor();await page.screenshot({path:'docs/screenshots/08-tablet-dashboard.png',fullPage:true});
await page.request.post(base+'/api/auth/logout',{headers:{Origin:new URL(base).origin}});
await browser.close();console.log('Eight actual application screenshots captured.');
