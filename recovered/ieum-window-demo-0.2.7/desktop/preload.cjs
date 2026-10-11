'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ieumDesktop',Object.freeze({
  mainHost: process.argv.includes('--ieum-main-host'),
  mode: process.argv.includes('--ieum-demo') ? 'demo' : 'installed',
  request: (route,payload)=>ipcRenderer.invoke('ieum:request',route,payload),
  connection: ()=>ipcRenderer.invoke('ieum:connection'),
  importConnection: ()=>ipcRenderer.invoke('ieum:import'),
  subscribe: callback=>{const listener=(_,data)=>callback(data);ipcRenderer.on('ieum:update',listener);return ()=>ipcRenderer.removeListener('ieum:update',listener);},
  windowAction: action=>ipcRenderer.invoke('ieum:window',action),
  openWorkspace: page=>ipcRenderer.invoke('ieum:workspace',page),
  toggleToday: (open,position)=>ipcRenderer.invoke('ieum:today',!!open,position),
  resizeMain: (open,position)=>ipcRenderer.invoke('ieum:resize',!!open,position),
  openCompose: draft=>ipcRenderer.invoke('ieum:compose',draft),
  composeDraft: ()=>ipcRenderer.invoke('ieum:compose-draft'),
  composeSent: draft=>ipcRenderer.invoke('ieum:compose-sent',draft),
  openChat: room=>ipcRenderer.invoke('ieum:chat',room),
  openAdmin: ()=>ipcRenderer.invoke('ieum:admin'),
  serverStatus: ()=>ipcRenderer.invoke('ieum:server-status'),
  startServer: config=>ipcRenderer.invoke('ieum:start-server',config),
  exportConnection: ()=>ipcRenderer.invoke('ieum:export'),
  backupServer: ()=>ipcRenderer.invoke('ieum:backup'),
  autoStart: enabled=>ipcRenderer.invoke('ieum:auto-start',!!enabled),
  notify: (title,body)=>ipcRenderer.invoke('ieum:notify',{title,body})
}));
