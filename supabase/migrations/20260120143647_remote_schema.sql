drop extension if exists "pg_net";


  create table "public"."note_nodes" (
    "id" uuid not null default gen_random_uuid(),
    "parent_id" uuid,
    "node_type" text not null,
    "slug" text not null,
    "title" text not null,
    "sort_order" integer not null default 0,
    "post_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."post_tags" (
    "post_id" uuid not null,
    "tag_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "excerpt" text not null default ''::text,
    "content_md" text not null,
    "category" text not null,
    "published_date" date,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "created_at" timestamp with time zone not null default now()
      );


CREATE INDEX idx_note_nodes_parent_sort ON public.note_nodes USING btree (parent_id, sort_order);

CREATE INDEX idx_post_tags_tag_id_post_id ON public.post_tags USING btree (tag_id, post_id);

CREATE INDEX idx_posts_category_published_date ON public.posts USING btree (category, published_date DESC);

CREATE UNIQUE INDEX note_nodes_pkey ON public.note_nodes USING btree (id);

CREATE UNIQUE INDEX post_tags_pkey ON public.post_tags USING btree (post_id, tag_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX posts_slug_key ON public.posts USING btree (slug);

CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);

CREATE UNIQUE INDEX ux_note_nodes_parent_slug ON public.note_nodes USING btree (parent_id, slug);

CREATE UNIQUE INDEX ux_note_nodes_post_id ON public.note_nodes USING btree (post_id) WHERE (post_id IS NOT NULL);

CREATE UNIQUE INDEX ux_note_nodes_root_slug ON public.note_nodes USING btree (slug) WHERE (parent_id IS NULL);

alter table "public"."note_nodes" add constraint "note_nodes_pkey" PRIMARY KEY using index "note_nodes_pkey";

alter table "public"."post_tags" add constraint "post_tags_pkey" PRIMARY KEY using index "post_tags_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."note_nodes" add constraint "chk_note_nodes_node_type" CHECK ((node_type = ANY (ARRAY['folder'::text, 'post'::text]))) not valid;

alter table "public"."note_nodes" validate constraint "chk_note_nodes_node_type";

alter table "public"."note_nodes" add constraint "chk_note_nodes_post_id_required" CHECK ((((node_type = 'post'::text) AND (post_id IS NOT NULL)) OR ((node_type = 'folder'::text) AND (post_id IS NULL)))) not valid;

alter table "public"."note_nodes" validate constraint "chk_note_nodes_post_id_required";

alter table "public"."note_nodes" add constraint "note_nodes_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.note_nodes(id) ON DELETE CASCADE not valid;

alter table "public"."note_nodes" validate constraint "note_nodes_parent_id_fkey";

alter table "public"."note_nodes" add constraint "note_nodes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."note_nodes" validate constraint "note_nodes_post_id_fkey";

alter table "public"."post_tags" add constraint "post_tags_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_tags" validate constraint "post_tags_post_id_fkey";

alter table "public"."post_tags" add constraint "post_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."post_tags" validate constraint "post_tags_tag_id_fkey";

alter table "public"."posts" add constraint "posts_slug_key" UNIQUE using index "posts_slug_key";

alter table "public"."tags" add constraint "tags_name_key" UNIQUE using index "tags_name_key";

alter table "public"."tags" add constraint "tags_slug_key" UNIQUE using index "tags_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."note_nodes" to "anon";

grant insert on table "public"."note_nodes" to "anon";

grant references on table "public"."note_nodes" to "anon";

grant select on table "public"."note_nodes" to "anon";

grant trigger on table "public"."note_nodes" to "anon";

grant truncate on table "public"."note_nodes" to "anon";

grant update on table "public"."note_nodes" to "anon";

grant delete on table "public"."note_nodes" to "authenticated";

grant insert on table "public"."note_nodes" to "authenticated";

grant references on table "public"."note_nodes" to "authenticated";

grant select on table "public"."note_nodes" to "authenticated";

grant trigger on table "public"."note_nodes" to "authenticated";

grant truncate on table "public"."note_nodes" to "authenticated";

grant update on table "public"."note_nodes" to "authenticated";

grant delete on table "public"."note_nodes" to "service_role";

grant insert on table "public"."note_nodes" to "service_role";

grant references on table "public"."note_nodes" to "service_role";

grant select on table "public"."note_nodes" to "service_role";

grant trigger on table "public"."note_nodes" to "service_role";

grant truncate on table "public"."note_nodes" to "service_role";

grant update on table "public"."note_nodes" to "service_role";

grant delete on table "public"."post_tags" to "anon";

grant insert on table "public"."post_tags" to "anon";

grant references on table "public"."post_tags" to "anon";

grant select on table "public"."post_tags" to "anon";

grant trigger on table "public"."post_tags" to "anon";

grant truncate on table "public"."post_tags" to "anon";

grant update on table "public"."post_tags" to "anon";

grant delete on table "public"."post_tags" to "authenticated";

grant insert on table "public"."post_tags" to "authenticated";

grant references on table "public"."post_tags" to "authenticated";

grant select on table "public"."post_tags" to "authenticated";

grant trigger on table "public"."post_tags" to "authenticated";

grant truncate on table "public"."post_tags" to "authenticated";

grant update on table "public"."post_tags" to "authenticated";

grant delete on table "public"."post_tags" to "service_role";

grant insert on table "public"."post_tags" to "service_role";

grant references on table "public"."post_tags" to "service_role";

grant select on table "public"."post_tags" to "service_role";

grant trigger on table "public"."post_tags" to "service_role";

grant truncate on table "public"."post_tags" to "service_role";

grant update on table "public"."post_tags" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

CREATE TRIGGER trg_note_nodes_updated_at BEFORE UPDATE ON public.note_nodes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


