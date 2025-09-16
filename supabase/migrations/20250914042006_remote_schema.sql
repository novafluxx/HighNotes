drop extension if exists "pg_net";

revoke delete on table "public"."notes" from "anon";

revoke insert on table "public"."notes" from "anon";

revoke references on table "public"."notes" from "anon";

revoke select on table "public"."notes" from "anon";

revoke trigger on table "public"."notes" from "anon";

revoke truncate on table "public"."notes" from "anon";

revoke update on table "public"."notes" from "anon";

revoke delete on table "public"."notes" from "authenticated";

revoke insert on table "public"."notes" from "authenticated";

revoke references on table "public"."notes" from "authenticated";

revoke select on table "public"."notes" from "authenticated";

revoke trigger on table "public"."notes" from "authenticated";

revoke truncate on table "public"."notes" from "authenticated";

revoke update on table "public"."notes" from "authenticated";

revoke delete on table "public"."notes" from "service_role";

revoke insert on table "public"."notes" from "service_role";

revoke references on table "public"."notes" from "service_role";

revoke select on table "public"."notes" from "service_role";

revoke trigger on table "public"."notes" from "service_role";

revoke truncate on table "public"."notes" from "service_role";

revoke update on table "public"."notes" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles(user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notes_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.search_vector = to_tsvector('simple', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$function$
;


