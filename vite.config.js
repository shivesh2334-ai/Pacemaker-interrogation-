import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import handler from './api/claude.js';
export default defineConfig(({mode}) => {
  Object.assign(process.env,loadEnv(mode,process.cwd(),''));
  return {plugins:[react(),tailwind(),{name:'local-api',configureServer(server){server.middlewares.use('/api/claude',async(req,res)=>{
    let body=''; for await(const chunk of req){body+=chunk;if(body.length>4300000){res.statusCode=413;res.end(JSON.stringify({error:{message:'File too large'}}));return;}}
    req.body=body;res.status=(code)=>{res.statusCode=code;return res};res.json=(data)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};await handler(req,res);
  })}}]};
});
