export const percent = (value:number) => `${Math.round(value*100)}%`
export const money = (minor:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(minor/100)
export const title = (value:string) => value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())
