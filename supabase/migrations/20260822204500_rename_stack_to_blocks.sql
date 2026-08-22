insert into public.games (id, title, sort_order)
values ('blocks', 'Blocks', 3)
on conflict (id) do update set title = excluded.title, sort_order = excluded.sort_order;

update public.game_scores
set game_id = 'blocks'
where game_id = 'stack';

delete from public.games
where id = 'stack';
