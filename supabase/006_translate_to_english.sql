-- MyWealth — translate existing default category names and account
-- groups from Indonesian to English, to match the app UI now being
-- fully in English. Safe to run once; any row not matching these exact
-- Indonesian names (e.g. a category you already renamed yourself) is
-- left untouched.

-- Expense categories
update categories set name = 'Food'          where name = 'Makanan';
update categories set name = 'Transportation' where name = 'Transportasi';
update categories set name = 'Bills'          where name = 'Tagihan';
update categories set name = 'Shopping'       where name = 'Belanja';
update categories set name = 'Health'         where name = 'Kesehatan';
update categories set name = 'Entertainment'  where name = 'Hiburan';
update categories set name = 'Education'      where name = 'Pendidikan';
update categories set name = 'Other'          where name = 'Lainnya' and type = 'expense';

-- Income categories
update categories set name = 'Salary'            where name = 'Gaji';
update categories set name = 'Investment Income'  where name = 'Hasil Investasi';
update categories set name = 'Other'              where name = 'Lainnya' and type = 'income';

-- Account groups
update accounts set account_group = 'Cash & Bank'          where account_group = 'Kas & Bank';
update accounts set account_group = 'Digital Wallet'       where account_group = 'Dompet Digital';
update accounts set account_group = 'Assets & Investments' where account_group = 'Aset & Investasi';
update accounts set account_group = 'Credit Card/Debt'     where account_group = 'Kartu Kredit/Hutang';

-- Verify:
select name, type from categories order by type, name;
select name, account_group from accounts order by account_group, name;
