
  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "phone" text not null,
    "photo_path" text,
    "created_at" timestamp with time zone default now()
      );


CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

alter table "public"."users" enable row level security;

  create policy "Enable insert for admins only"
  on "public"."users"
  as permissive
  for insert
  to supabase_admin
with check (true);

  create policy "Enable read access for admins only"
  on "public"."users"
  as permissive
  for select
  to supabase_admin
using (true);
