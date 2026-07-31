update asset
set current_price = null,
    price_date = null
where (ticker = 'PETR4' and current_price = 32.50)
   or (ticker = 'VALE3' and current_price = 61.20)
   or (ticker = 'ITUB4' and current_price = 36.80)
   or (ticker = 'WEGE3' and current_price = 45.10)
   or (ticker = 'MXRF11' and current_price = 9.65)
   or (ticker = 'HGLG11' and current_price = 158.40)
   or (ticker = 'KNRI11' and current_price = 145.30);
