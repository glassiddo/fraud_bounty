export const percent = (value:number) => `${Math.round(value*100)}%`
export const money = (minor:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(minor/100)
