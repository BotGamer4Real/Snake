insert into public.games (id, title, sort_order)
values ('brick', 'Brick', 5)
on conflict (id) do update set title = excluded.title, sort_order = excluded.sort_order;
